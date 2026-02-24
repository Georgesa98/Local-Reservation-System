/**
 * Type declarations for APIs exposed from the Electron preload script via
 * contextBridge. These are available on `window.electronAPI` inside the
 * renderer process only.
 */
export interface ElectronAPI {
  getAppVersion: () => Promise<string>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
