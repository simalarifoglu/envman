import { ipcMain, dialog, clipboard } from 'electron'
import { randomUUID } from 'node:crypto'
import { scanFolder, readEnvFile, writeEnvFile } from './scan'
import { getProjects, addProject, removeProject, updateProjectName } from './store'
import { serializeEnvFile } from '../src/shared/parser'
import type { EnvEntry } from '../src/shared/types'

export function registerIpcHandlers() {

  ipcMain.handle('projects:get', () => {
    return getProjects()
  })

  ipcMain.handle('projects:add-by-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Proje klasörünü seç',
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const folderPath = result.filePaths[0]
    const name = folderPath.split(/[\\/]/).pop() ?? folderPath
    const id = randomUUID()

    const project = { id, name, folderPath }
    addProject(project)

    const envFiles = scanFolder(folderPath)
    return { ...project, envFiles }
  })

  ipcMain.handle('projects:add-by-path', (_e, folderPath: string) => {
    const name = folderPath.split(/[\\/]/).pop() ?? folderPath
    const id = randomUUID()
    const project = { id, name, folderPath }
    addProject(project)
    const envFiles = scanFolder(folderPath)
    return { ...project, envFiles }
  })

  ipcMain.handle('projects:remove', (_e, id: string) => {
    removeProject(id)
    return true
  })

  ipcMain.handle('projects:rename', (_e, id: string, name: string) => {
    updateProjectName(id, name)
    return true
  })

  ipcMain.handle('projects:scan', (_e, folderPath: string) => {
    return scanFolder(folderPath)
  })

  ipcMain.handle('envfile:read', (_e, filePath: string) => {
    return readEnvFile(filePath)
  })

  ipcMain.handle('envfile:write', (_e, filePath: string, entries: EnvEntry[]) => {
    const content = serializeEnvFile(entries)
    writeEnvFile(filePath, content)
    return true
  })

  ipcMain.handle('clipboard:write', (_e, text: string) => {
    clipboard.writeText(text)
    return true
  })

  ipcMain.handle('projects:discover', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Ana klasörü seç — alt projeler taranacak',
    })
    if (result.canceled || result.filePaths.length === 0) return []

    const parentPath = result.filePaths[0]
    const { readdirSync } = await import('node:fs')

    const discovered: Array<{ id: string; name: string; folderPath: string; envFiles: ReturnType<typeof scanFolder> }> = []

    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue

      const folderPath = `${parentPath}/${entry.name}`
      const envFiles = scanFolder(folderPath)
      if (envFiles.length === 0) continue

      const id = randomUUID()
      const project = { id, name: entry.name, folderPath }
      addProject(project)
      discovered.push({ ...project, envFiles })
    }

    return discovered
  })
}