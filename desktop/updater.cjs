const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const { createHash } = require("node:crypto");
const { spawn } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

// /releases/latest excludes GitHub prereleases. This application ships preview
// builds, so inspect published releases and select the highest semver instead.
const RELEASE_API = "https://api.github.com/repos/natanai/digi.mn/releases?per_page=30";
const ASSET_LIMIT = 600 * 1024 * 1024;
const USER_AGENT = "digi.mn-Windows-Portability";

function parseVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value ?? "");
  if (!match) return null;
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: match[4] ? match[4].split(".") : [],
  };
}

/** SemVer release ordering: 0.1.0-preview.4 < 0.1.0 < 0.1.1-preview.1. */
function compareVersions(left, right) {
  const a = parseVersion(left), b = parseVersion(right);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i] ? 1 : -1;
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  for (let i = 0; i < Math.min(a.prerelease.length, b.prerelease.length); i++) {
    const x = a.prerelease[i], y = b.prerelease[i];
    if (x === y) continue;
    const xNum = /^\d+$/.test(x), yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const xInt = BigInt(x), yInt = BigInt(y);
      return xInt > yInt ? 1 : -1;
    }
    if (xNum !== yNum) return xNum ? -1 : 1;
    return x > y ? 1 : -1;
  }
  return Math.sign(a.prerelease.length - b.prerelease.length);
}
function isNewerVersion(candidate, installed) {
  return compareVersions(candidate, installed) === 1;
}
function selectRelease(release, currentVersion) {
  const installed = parseVersion(currentVersion);
  if (!installed || !release || release.draft || !isNewerVersion(release.tag_name, currentVersion)) return null;
  const candidate = parseVersion(release.tag_name);
  if (!candidate) return null;
  // A user on a stable release gets only stable updates. A preview tester
  // can move to newer previews or the final stable release.
  if (!installed.prerelease.length && (release.prerelease || candidate.prerelease.length)) return null;
  const version = release.tag_name.replace(/^v/, "");
  const name = "digi.mn-v" + version + "-windows-x64.zip";
  const asset = release.assets?.find((item) => item.name === name);
  if (!asset || !Number.isSafeInteger(asset.size) || asset.size < 1 || asset.size > ASSET_LIMIT) {
    throw new Error("The newer release " + version + " has no compatible Windows ZIP.");
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(asset.digest ?? "")) {
    throw new Error("The newer release " + version + " has no verifiable SHA-256 digest.");
  }
  const expectedUrl = "https://github.com/natanai/digi.mn/releases/download/v" + version + "/" + name;
  if (asset.browser_download_url !== expectedUrl) {
    throw new Error("The Windows asset did not come from the official GitHub release.");
  }
  return { version, asset };
}
function selectUpdateFromReleases(releases, currentVersion) {
  if (!Array.isArray(releases)) throw new Error("GitHub returned an invalid release list.");
  const eligible = releases.filter((release) => release && !release.draft
    && isNewerVersion(release.tag_name, currentVersion)
    && (parseVersion(currentVersion)?.prerelease.length || !(release.prerelease || parseVersion(release.tag_name)?.prerelease.length)));
  eligible.sort((a, b) => compareVersions(b.tag_name, a.tag_name) ?? 0);
  // Fail closed on an invalid newest official release rather than silently
  // falling back to a different artifact.
  return eligible.length ? selectRelease(eligible[0], currentVersion) : null;
}
async function findUpdate(currentVersion) {
  const response = await fetch(RELEASE_API, {
    headers: { "user-agent": USER_AGENT, accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error("GitHub release check failed (" + response.status + ").");
  return selectUpdateFromReleases(await response.json(), currentVersion);
}
function powershell(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", ...args], {
      windowsHide: true, stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("Windows ZIP extraction failed (" + code + ").")));
  });
}
async function downloadZip(asset, destination, progress) {
  const response = await fetch(asset.browser_download_url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok || !response.body) throw new Error("The release download failed (" + response.status + ").");
  let received = 0;
  const hash = createHash("sha256");
  const chunks = Readable.fromWeb(response.body).map((chunk) => {
    received += chunk.byteLength;
    if (received > ASSET_LIMIT) throw new Error("Release download exceeded the maximum allowed size.");
    hash.update(chunk);
    progress?.(received, asset.size);
    return chunk;
  });
  await pipeline(chunks, fs.createWriteStream(destination, { flags: "wx" }));
  if (received !== asset.size || ("sha256:" + hash.digest("hex")).toLowerCase() !== asset.digest.toLowerCase()) {
    throw new Error("The release ZIP failed integrity verification. No files were changed.");
  }
}
async function stageUpdate({ release, root, scriptSource, onProgress }) {
  const next = path.join(root, "_engine.next");
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "digi-mn-update-"));
  try {
    if (fs.existsSync(next) || fs.existsSync(path.join(root, "_engine.previous"))) {
      throw new Error("An earlier update is incomplete. Inspect _engine.next or _engine.previous before updating.");
    }
    const zip = path.join(tmp, "release.zip");
    await downloadZip(release.asset, zip, onProgress);
    const expanded = path.join(tmp, "unpacked");
    const psLiteral = (value) => "\'" + value.replace(/\'/g, "\'\'") + "\'";
    await powershell(["-Command", "Expand-Archive -LiteralPath " + psLiteral(zip) + " -DestinationPath " + psLiteral(expanded) + " -Force"]);
    const stageRoot = path.join(expanded, "digi.mn");
    const engine = path.join(stageRoot, "_engine");
    for (const required of [
      path.join(stageRoot, "installation.txt"),
      path.join(engine, "digi.mn.exe"),
      path.join(engine, "resources"),
    ]) {
      if (!fs.existsSync(required)) throw new Error("The new ZIP has an unexpected installation layout.");
    }
    if (fs.existsSync(path.join(engine, "data"))) throw new Error("The downloaded runtime unexpectedly contains saved game data.");
    await fsp.cp(engine, next, { recursive: true, errorOnExist: true, force: false });
    const scriptFile = path.join(tmp, "apply-update.ps1");
    await fsp.copyFile(scriptSource, scriptFile);
    await fsp.rm(path.join(tmp, "unpacked"), { recursive: true, force: true });
    await fsp.rm(zip, { force: true });
    return { next, tmp, scriptFile };
  } catch (error) {
    await fsp.rm(next, { recursive: true, force: true }).catch(() => {});
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}
function applyAfterExit({ root, tmp, scriptFile, parentPid }) {
  const child = spawn("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptFile,
    "-Root", root, "-OldPid", String(parentPid), "-TempRoot", tmp,
  ], { detached: true, windowsHide: true, stdio: "ignore" });
  child.unref();
  return child;
}
module.exports = { parseVersion, compareVersions, isNewerVersion, selectRelease, selectUpdateFromReleases, findUpdate, stageUpdate, applyAfterExit };
