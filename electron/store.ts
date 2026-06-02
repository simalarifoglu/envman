import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const Store = require('electron-store')

export interface StoredProject {
  id: string
  name: string
  folderPath: string
}

const store = new Store({ defaults: { projects: [] } })

export function getProjects(): StoredProject[] {
  return store.get('projects', [])
}

export function addProject(project: StoredProject): void {
  const projects = getProjects()
  const exists = projects.find((p: StoredProject) => p.folderPath === project.folderPath)
  if (!exists) {
    store.set('projects', [...projects, project])
  }
}

export function removeProject(id: string): void {
  const projects = getProjects()
  store.set('projects', projects.filter((p: StoredProject) => p.id !== id))
}

export function updateProjectName(id: string, name: string): void {
  const projects = getProjects()
  store.set(
    'projects',
    projects.map((p: StoredProject) => (p.id === id ? { ...p, name } : p))
  )
}