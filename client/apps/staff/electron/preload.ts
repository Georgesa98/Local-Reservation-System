import { contextBridge, ipcRenderer } from 'electron'

interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface Tokens {
  access: string
  refresh: string
}

/**
 * Exposes a safe subset of Electron APIs to the renderer process via
 * `window.electronAPI`. All calls go through the contextBridge so the
 * renderer never has direct access to Node.js / Electron internals.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Returns the current application version string. */
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:get-version'),

  /** Saves encrypted tokens to persistent storage. */
  saveTokens: (access: string, refresh: string): Promise<IpcResponse> =>
    ipcRenderer.invoke('token:save', access, refresh),

  /** Retrieves encrypted tokens from persistent storage. */
  getTokens: (): Promise<IpcResponse<Tokens | null>> =>
    ipcRenderer.invoke('token:get'),

  /** Clears stored tokens. */
  clearTokens: (): Promise<IpcResponse> =>
    ipcRenderer.invoke('token:clear'),

  /** Checks if encryption is available on this system. */
  isEncryptionAvailable: (): Promise<boolean> =>
    ipcRenderer.invoke('token:isEncryptionAvailable'),
})
