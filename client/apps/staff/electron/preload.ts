import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes a safe subset of Electron APIs to the renderer process via
 * `window.electronAPI`. All calls go through the contextBridge so the
 * renderer never has direct access to Node.js / Electron internals.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Returns the current application version string. */
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:get-version'),
})
