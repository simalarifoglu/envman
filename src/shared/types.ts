export interface EnvEntry {
  key: string
  value: string
  comment?: string
  enabled: boolean
}

export interface EnvFile {
  filename: string
  path: string
  entries: EnvEntry[]
}

export interface Project {
  id: string
  name: string
  folderPath: string
  envFiles: EnvFile[]
}

export interface SearchResult {
  projectId: string
  projectName: string
  filePath: string
  filename: string
  entry: EnvEntry
}