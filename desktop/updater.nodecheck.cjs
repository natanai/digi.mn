const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseVersion, compareVersions, isNewerVersion, selectRelease,
  selectUpdateFromReleases,
} = require("./updater.cjs");

function release(version, prerelease = version.includes("-")) {
  return {
    tag_name: "v" + version,
    draft: false,
    prerelease,
    assets: [{
      name: "digi.mn-v" + version + "-windows-x64.zip",
      size: 213516081,
      digest: "sha256:" + "a".repeat(64),
      browser_download_url: "https://github.com/natanai/digi.mn/releases/download/v" +
        version + "/digi.mn-v" + version + "-windows-x64.zip",
    }],
  };
}

test("SemVer correctly orders preview, release candidate and stable builds", () => {
  assert.equal(parseVersion("v0.1.0-preview.4").prerelease[1], "4");
  assert.equal(isNewerVersion("v0.1.0-preview.4", "0.1.0-preview.1"), true);
  assert.equal(isNewerVersion("v0.1.0-preview.2", "0.1.0-preview.11"), false);
  assert.equal(isNewerVersion("v0.1.0-preview.10", "0.1.0-preview.9"), true);
  assert.equal(isNewerVersion("v0.1.0", "0.1.0-preview.99"), true);
  assert.equal(isNewerVersion("v0.1.1-preview.1", "0.1.0"), true);
  assert.equal(isNewerVersion("v0.1.12", "0.1.11"), true);
  assert.equal(isNewerVersion("v0.1.10", "0.1.11"), false);
  assert.equal(isNewerVersion("v0.1.11", "0.1.11"), false);
  assert.equal(isNewerVersion("v0.2.0", "0.1.99"), true);
  assert.equal(isNewerVersion("invalid", "0.1.11"), false);
  assert.equal(compareVersions("0.1.0-preview.3", "0.1.0-preview.3"), 0);
});

test("Preview installations receive the newest published preview, not merely the latest stable", () => {
  const releases = [
    release("0.1.0-preview.4"),
    release("0.1.0-preview.1"),
    release("0.0.9", false),
    release("0.1.0-preview.3"),
  ];
  assert.equal(selectUpdateFromReleases(releases, "0.1.0-preview.1").version, "0.1.0-preview.4");
  assert.equal(selectUpdateFromReleases(releases, "0.1.0-preview.4"), null);
  assert.equal(selectUpdateFromReleases(releases.reverse(), "0.1.0-preview.2").version, "0.1.0-preview.4");
});

test("Stable installations stay on stable channel but preview testers can upgrade to stable", () => {
  const builds = [release("0.2.0-preview.1"), release("0.1.1", false), release("0.1.0", false)];
  assert.equal(selectUpdateFromReleases(builds, "0.1.0").version, "0.1.1");
  assert.equal(selectUpdateFromReleases(builds, "0.1.0-preview.4").version, "0.2.0-preview.1");
  assert.equal(selectRelease(release("0.2.0-preview.1"), "0.1.0"), null);
  assert.equal(selectRelease(release("0.1.1", false), "0.1.0").version, "0.1.1");
});

test("Only the official Windows ZIP with verified SHA-256 digest is accepted", () => {
  const valid = release("0.1.0-preview.5");
  assert.equal(selectRelease(valid, "0.1.0-preview.4").version, "0.1.0-preview.5");
  assert.equal(selectRelease(valid, "0.1.0-preview.5"), null);
  assert.equal(selectRelease({ ...valid, draft: true }, "0.1.0-preview.4"), null);
  assert.throws(() => selectRelease({ ...valid, assets: [{ ...valid.assets[0], digest: null }] }, "0.1.0-preview.4"), /digest/);
  assert.throws(() => selectRelease({ ...valid, assets: [{ ...valid.assets[0], browser_download_url: "https://evil.invalid/file.zip" }] }, "0.1.0-preview.4"), /official/);
  assert.throws(() => selectRelease({ ...valid, assets: [] }, "0.1.0-preview.4"), /compatible/);
  assert.equal(selectUpdateFromReleases([{ ...valid, draft: true }], "0.1.0-preview.4"), null);
  assert.throws(() => selectUpdateFromReleases({}, "0.1.0-preview.4"), /release list/);
});

test("A bad newest release does not silently redirect the updater to another artifact", () => {
  const newBroken = release("0.1.0-preview.6");
  newBroken.assets[0].digest = "not-a-sha";
  assert.throws(() =>
    selectUpdateFromReleases([release("0.1.0-preview.5"), newBroken], "0.1.0-preview.4"), /digest/);
});
