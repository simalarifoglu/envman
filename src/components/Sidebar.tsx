import { useState } from 'react'
import type { Project } from '../shared/types'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  activeFilePath: string | null
  onSelectProject: (id: string) => void
  onSelectFile: (filePath: string) => void
  onAddProject: () => void
  onDiscoverProjects: () => void
  onRemoveProject: (id: string) => void
  onOpenSearch: () => void
}

export default function Sidebar({
  projects,
  activeProjectId,
  activeFilePath,
  onSelectProject,
  onSelectFile,
  onAddProject,
  onDiscoverProjects,
  onRemoveProject,
  onOpenSearch,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <aside className="w-60 flex flex-col h-screen" style={{ background: '#090c14', borderRight: '1px solid #0f172a' }}>

      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #0f172a' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-100 tracking-tight">EnvMan</span>
        </div>
        <button
          onClick={onOpenSearch}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          title="Global arama"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {projects.length === 0 && (
          <div className="px-5 py-8 text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#0f172a' }}>
              <svg width="18" height="18" fill="none" stroke="#334155" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: '#334155' }}>Henüz proje yok</p>
          </div>
        )}

        {projects.map((project) => {
          const isActive = project.id === activeProjectId
          const isExpanded = expanded.has(project.id)

          return (
            <div key={project.id} className="px-2 mb-0.5">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                style={{
                  background: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? '#e2e8f0' : '#64748b',
                }}
                onMouseEnter={(e) => {
                  setHoveredProject(project.id)
                  if (!isActive) e.currentTarget.style.background = '#0a0f1e'
                }}
                onMouseLeave={(e) => {
                  setHoveredProject(null)
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
                onClick={() => {
                  onSelectProject(project.id)
                  toggleExpand(project.id)
                }}
              >
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"
                  className="shrink-0 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: '#334155' }}>
                  <path d="M3 2l4 3-4 3V2z" />
                </svg>

                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5"
                  viewBox="0 0 24 24" className="shrink-0" style={{ color: isActive ? '#818cf8' : '#334155' }}>
                  <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>

                <span className="text-xs font-medium truncate flex-1">{project.name}</span>

                {hoveredProject === project.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveProject(project.id) }}
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0"
                    style={{ color: '#334155' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                  >
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="ml-3 mt-0.5 mb-1">
                  {project.envFiles.length === 0 ? (
                    <p className="text-xs px-3 py-1.5" style={{ color: '#1e293b' }}>.env bulunamadı</p>
                  ) : (
                    project.envFiles.map((file) => {
                      const isActiveFile = activeFilePath === file.path
                      return (
                        <div
                          key={file.path}
                          onClick={() => onSelectFile(file.path)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all mb-0.5"
                          style={{
                            background: isActiveFile ? 'rgba(99,102,241,0.12)' : 'transparent',
                            color: isActiveFile ? '#818cf8' : '#475569',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActiveFile) {
                              e.currentTarget.style.background = '#0a0f1e'
                              e.currentTarget.style.color = '#94a3b8'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActiveFile) {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = '#475569'
                            }
                          }}
                        >
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5"
                            viewBox="0 0 24 24" className="shrink-0">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                            <path d="M14 2v6h6" />
                          </svg>
                          <span className="text-xs truncate flex-1">{file.filename}</span>
                          <span className="text-xs rounded-full px-1.5 py-0.5"
                            style={{ background: '#0f172a', color: '#334155', fontSize: '10px' }}>
                            {file.entries.length}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid #0f172a' }}>
        <button
          onClick={onAddProject}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all mb-2"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Proje ekle
        </button>
        <button
          onClick={onDiscoverProjects}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all"
          style={{ color: '#334155' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0a0f1e'; e.currentTarget.style.color = '#64748b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155' }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          Otomatik tara
        </button>
      </div>
    </aside>
  )
}