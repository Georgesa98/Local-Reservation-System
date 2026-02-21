import { contextBridge, ipcRenderer } from 'electron'

const desktopAPI = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  ping: (): Promise<string> => ipcRenderer.invoke('app:ping'),
}

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI)
