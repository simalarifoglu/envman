"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("envman", {
  getProjects: () => electron.ipcRenderer.invoke("projects:get"),
  addProjectByDialog: () => electron.ipcRenderer.invoke("projects:add-by-dialog"),
  addProjectByPath: (folderPath) => electron.ipcRenderer.invoke("projects:add-by-path", folderPath),
  removeProject: (id) => electron.ipcRenderer.invoke("projects:remove", id),
  renameProject: (id, name) => electron.ipcRenderer.invoke("projects:rename", id, name),
  scanProject: (folderPath) => electron.ipcRenderer.invoke("projects:scan", folderPath),
  discoverProjects: () => electron.ipcRenderer.invoke("projects:discover"),
  readEnvFile: (filePath) => electron.ipcRenderer.invoke("envfile:read", filePath),
  writeEnvFile: (filePath, entries) => electron.ipcRenderer.invoke("envfile:write", filePath, entries),
  copyToClipboard: (text) => electron.ipcRenderer.invoke("clipboard:write", text)
});
