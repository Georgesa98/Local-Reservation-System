export interface DesktopAPI {
  getVersion: () => Promise<string>
  ping: () => Promise<string>
}

declare global {
  interface Window {
    desktopAPI: DesktopAPI
  }
}
