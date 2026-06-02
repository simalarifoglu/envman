import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import EnvEditor from './components/EnvEditor'
import GlobalSearch from './components/GlobalSearch'
import type { Project, EnvFile } from './shared/types'

declare global {
  interface Window {
    envman: {
      getProjects: () => Promise<Array<{ id: string; name: string; folderPath: string }>>
      addProjectByDialog: () => Promise<Project | null>
      addProjectByPath: (folderPath: string) => Promise<Project | null>
      removeProject: (id: string) => Promise<boolean>
      renameProject: (id: string, name: string) => Promise<boolean>
      scanProject: (folderPath: string) => Promise<EnvFile[]>
      discoverProjects: () => Promise<Project[]>
      readEnvFile: (filePath: string) => Promise<EnvFile>
      writeEnvFile: (filePath: string, entries: unknown) => Promise<boolean>
      copyToClipboard: (text: string) => Promise<boolean>
    }
  }
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null
  const activeFile = activeProject?.envFiles.find((f) => f.path === activeFilePath) ?? null

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    const stored = await window.envman.getProjects()
    const withFiles = await Promise.all(
      stored.map(async (p) => {
        const envFiles = await window.envman.scanProject(p.folderPath)
        return { ...p, envFiles }
      })
    )
    setProjects(withFiles)
    if (withFiles.length > 0 && !activeProjectId) {
      setActiveProjectId(withFiles[0].id)
      if (withFiles[0].envFiles.length > 0) {
        setActiveFilePath(withFiles[0].envFiles[0].path)
      }
    }
  }

  async function handleAddProject() {
    const project = await window.envman.addProjectByDialog()
    if (!project) return
    setProjects((prev) => [...prev, project])
    setActiveProjectId(project.id)
    if (project.envFiles.length > 0) {
      setActiveFilePath(project.envFiles[0].path)
    }
  }

  async function handleDiscoverProjects() {
    const discovered = await window.envman.discoverProjects()
    if (!discovered.length) return
    setProjects((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const newOnes = discovered.filter((p) => !existingIds.has(p.id))
      return [...prev, ...newOnes]
    })
    setActiveProjectId(discovered[0].id)
    if (discovered[0].envFiles.length > 0) {
      setActiveFilePath(discovered[0].envFiles[0].path)
    }
  }

  async function handleRemoveProject(id: string) {
    await window.envman.removeProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (activeProjectId === id) {
      setActiveProjectId(null)
      setActiveFilePath(null)
    }
  }

  async function handleFileSave(filePath: string, entries: EnvFile['entries']) {
    await window.envman.writeEnvFile(filePath, entries)
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        envFiles: p.envFiles.map((f) =>
          f.path === filePath ? { ...f, entries } : f
        ),
      }))
    )
  }

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        activeFilePath={activeFilePath}
        onSelectProject={(id) => {
          setActiveProjectId(id)
          const p = projects.find((p) => p.id === id)
          if (p && p.envFiles.length > 0) setActiveFilePath(p.envFiles[0].path)
        }}
        onSelectFile={(filePath) => setActiveFilePath(filePath)}
        onAddProject={handleAddProject}
        onDiscoverProjects={handleDiscoverProjects}
        onRemoveProject={handleRemoveProject}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main className="flex-1 overflow-hidden">
        {activeFile ? (
          <EnvEditor
            file={activeFile}
            onSave={(entries) => handleFileSave(activeFile.path, entries)}
            onCopy={(text) => window.envman.copyToClipboard(text)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-3">
            <span className="text-4xl">🔑</span>
            <p className="text-sm">Sol panelden bir proje veya dosya seç</p>
          </div>
        )}
      </main>

      {searchOpen && (
        <GlobalSearch
          projects={projects}
          onClose={() => setSearchOpen(false)}
          onNavigate={(filePath, projectId) => {
            setActiveProjectId(projectId)
            setActiveFilePath(filePath)
            setSearchOpen(false)
          }}
          onCopy={(text) => window.envman.copyToClipboard(text)}
        />
      )}
    </div>
  )
}