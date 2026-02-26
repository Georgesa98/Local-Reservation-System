/**
 * Type declarations for APIs exposed from the Electron preload script via
 * contextBridge. These are available on `window.electronAPI` inside the
 * renderer process only.
 */

interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface Tokens {
  access: string
  refresh: string
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>
  saveTokens: (access: string, refresh: string) => Promise<IpcResponse>
  getTokens: () => Promise<IpcResponse<Tokens | null>>
  clearTokens: () => Promise<IpcResponse>
  isEncryptionAvailable: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
