import { useEffect, useState } from "react";
import { AuthorDesktopResizeHandle } from "../author/AuthorDesktopResizeHandle";

const SETTINGS_KEY = "pre-programmed:display-settings";

type DesktopUpdateStatus = {
  phase: "checking" | "available" | "downloading" | "verifying" | "extracting" |
    "preparing" | "restarting" | "up-to-date" | "cancelled" | "failed";
  message: string;
  version?: string;
  percent?: number;
};

type WindowsDesktopBridge = {
  checkForUpdates: () => Promise<{ message: string }>;
  getInstalledVersion: () => Promise<string>;
  onUpdateStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void;
};

function updateButtonLabel(status: DesktopUpdateStatus | null, updating: boolean): string {
  if (!updating) return "CHECK FOR UPDATES";
  switch (status?.phase) {
    case "checking": return "CHECKING...";
    case "available": return "UPDATE AVAILABLE...";
    case "downloading": return `DOWNLOADING ${status.percent ?? 0}%...`;
    case "verifying": return "VERIFYING...";
    case "extracting": return "EXTRACTING...";
    case "preparing": return "PREPARING...";
    case "restarting": return "RESTARTING...";
    default: return "UPDATING...";
  }
}
function windowsDesktopBridge() {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { preProgrammedDesktop?: WindowsDesktopBridge }).preProgrammedDesktop;
}


export type DisplaySettings = {
  fontSize: number;
  reduceMotion: boolean;
  textSpeedMultiplier: number;
};

const DEFAULT_SETTINGS: DisplaySettings = { fontSize: 16, reduceMotion: false, textSpeedMultiplier: 1 };

export function readDisplaySettings(): DisplaySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<DisplaySettings>;
    return {
      fontSize: typeof stored.fontSize === "number" ? Math.min(24, Math.max(12, stored.fontSize)) : 16,
      reduceMotion: Boolean(stored.reduceMotion),
      textSpeedMultiplier: typeof stored.textSpeedMultiplier === "number"
        ? Math.min(4, Math.max(.25, stored.textSpeedMultiplier))
        : 1,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AuthorSettings({ authorView, showAuthorViewToggle, visible = true, onToggleAuthorView, onTextSpeedMultiplierChange, onNewGame }: {
  authorView: boolean;
  showAuthorViewToggle: boolean;
  visible?: boolean;
  onToggleAuthorView: () => void;
  onTextSpeedMultiplierChange: (multiplier: number) => void;
  onNewGame?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(readDisplaySettings);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState<DesktopUpdateStatus | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const desktop = windowsDesktopBridge();

  useEffect(() => {
    if (!desktop) return;
    return desktop.onUpdateStatus((status) => {
      setUpdateStatus(status);
      setUpdateMessage(status.message);
      setUpdating(!["up-to-date", "cancelled", "failed"].includes(status.phase));
    });
  }, [desktop]);

  useEffect(() => {
    if (!desktop || !open) return;
    let active = true;
    void desktop.getInstalledVersion()
      .then((version) => { if (active) setInstalledVersion(version); })
      .catch(() => { if (active) setInstalledVersion("unavailable"); });
    return () => { active = false; };
  }, [desktop, open]);
  const checkForUpdates = async () => {
    if (!desktop || updating) return;
    setUpdating(true);
    setUpdateStatus({ phase: "checking", message: "Checking GitHub for updates..." });
    setUpdateMessage("Checking GitHub for updates...");
    try {
      const result = await desktop.checkForUpdates();
      setUpdateMessage(result.message);
      // A successfully prepared update stays busy until the app exits.
      if (!result.message.startsWith("Installing v")) setUpdating(false);
    } catch (error) {
      setUpdateMessage(error instanceof Error ? error.message : "Could not check for updates.");
      setUpdating(false);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--terminal-font-size", `${settings.fontSize}px`);
    root.dataset.reduceMotion = String(settings.reduceMotion);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    onTextSpeedMultiplierChange(settings.textSpeedMultiplier);
    return () => {
      root.style.removeProperty("--terminal-font-size");
      delete root.dataset.reduceMotion;
    };
  }, [settings, onTextSpeedMultiplierChange]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.authorExperience = String(showAuthorViewToggle && authorView);
    return () => {
      delete root.dataset.authorExperience;
    };
  }, [authorView, showAuthorViewToggle]);

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  return <>
    {showAuthorViewToggle && authorView ? <AuthorDesktopResizeHandle /> : null}
    {visible ? <div className="author-settings" onPointerDown={(event) => event.stopPropagation()}>
      <div className="author-corner-controls">
        {showAuthorViewToggle ? <button type="button" className="author-view-toggle" aria-label={authorView ? "Preview player experience" : "Return to Author experience"}
          aria-pressed={authorView} onClick={onToggleAuthorView}><span aria-hidden="true" /></button> : null}
        <button type="button" className="author-settings-gear" aria-label={desktop ? "Options" : "Display settings"} aria-expanded={open}
          onClick={() => setOpen((value) => !value)}>⚙</button>
      </div>
      {open ? <section className="author-settings-popover" aria-label="Display settings">
        <header><span>{desktop ? "OPTIONS" : "DISPLAY SETTINGS"}</span><button type="button" onClick={() => setOpen(false)}>[X]</button></header>
        <label>TEXT SIZE <span>{settings.fontSize}px</span>
          <input type="range" min={12} max={24} step={1} value={settings.fontSize} onChange={(event) => setSettings({ ...settings, fontSize: Number(event.target.value) })} />
        </label>
        <label>TEXT SPEED <span>{settings.textSpeedMultiplier.toFixed(2).replace(/\.00$/, "").replace(/0$/, "")}×</span>
          <input type="range" min={.25} max={4} step={.25} value={settings.textSpeedMultiplier} onChange={(event) => setSettings({ ...settings, textSpeedMultiplier: Number(event.target.value) })} />
        </label>
        <label className="check-label"><input type="checkbox" checked={settings.reduceMotion} onChange={(event) => setSettings({ ...settings, reduceMotion: event.target.checked })} /> reduce motion</label>
        {desktop ? <div className="desktop-options-actions">
          <div className="desktop-installed-version"><span>INSTALLED VERSION</span><strong>{installedVersion && installedVersion !== "unavailable" ? `v${installedVersion}` : installedVersion ?? "…"}</strong></div>
          <button type="button" onClick={() => { setOpen(false); onNewGame?.(); }} disabled={!onNewGame}>NEW GAME</button>
          <button type="button" onClick={() => { void checkForUpdates(); }} disabled={updating}>
            {updateButtonLabel(updateStatus, updating)}
          </button>
          {updateStatus?.phase === "downloading" ? <progress className="desktop-update-progress"
            aria-label="Update download progress" max={100} value={updateStatus.percent ?? 0} /> : null}
          {updateMessage ? <p role="status" aria-live="polite">{updateMessage}</p> : null}
        </div> : null}
      </section> : null}
    </div> : null}
  </>;
}
