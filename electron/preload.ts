import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('envman', {
  getProjects: () => ipcRenderer.invoke('projects:get'),
  addProjectByDialog: () => ipcRenderer.invoke('projects:add-by-dialog'),
  addProjectByPath: (folderPath: string) => ipcRenderer.invoke('projects:add-by-path', folderPath),
  removeProject: (id: string) => ipcRenderer.invoke('projects:remove', id),
  renameProject: (id: string, name: string) => ipcRenderer.invoke('projects:rename', id, name),
  scanProject: (folderPath: string) => ipcRenderer.invoke('projects:scan', folderPath),
  discoverProjects: () => ipcRenderer.invoke('projects:discover'),

  readEnvFile: (filePath: string) => ipcRenderer.invoke('envfile:read', filePath),
  writeEnvFile: (filePath: string, entries: unknown) => ipcRenderer.invoke('envfile:write', filePath, entries),

  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),
})