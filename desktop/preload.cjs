const { contextBridge, ipcRenderer } = require("electron");
// A deliberately narrow shell capability: no filesystem, Node or arbitrary IPC
// access is exposed to the game renderer.
contextBridge.exposeInMainWorld("preProgrammedDesktop", {
  checkForUpdates: () => ipcRenderer.invoke("pre-programmed:check-for-updates"),
  getInstalledVersion: () => ipcRenderer.invoke("pre-programmed:app-version"),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("pre-programmed:update-status", listener);
    return () => ipcRenderer.removeListener("pre-programmed:update-status", listener);
  },
});
