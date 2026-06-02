import { useState, useEffect, useRef } from 'react'
import type { Project, SearchResult } from '../shared/types'

interface Props {
  projects: Project[]
  onClose: () => void
  onNavigate: (filePath: string, projectId: string) => void
  onCopy: (text: string) => void
}

export default function GlobalSearch({ projects, onClose, onNavigate, onCopy }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0))
      if (e.key === 'Enter' && results[activeIndex]) {
        const r = results[activeIndex]
        onNavigate(r.filePath, r.projectId)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, results, activeIndex])

  useEffect(() => {
    setActiveIndex(0)
    if (!query.trim()) { setResults([]); return }

    const q = query.toLowerCase()
    const found: SearchResult[] = []

    for (const project of projects) {
      for (const file of project.envFiles) {
        for (const entry of file.entries) {
          if (entry.key.toLowerCase().includes(q) || entry.value.toLowerCase().includes(q)) {
            found.push({
              projectId: project.id,
              projectName: project.name,
              filePath: file.path,
              filename: file.filename,
              entry,
            })
          }
        }
      }
    }
    setResults(found)
  }, [query, projects])

  function handleCopy(value: string, idx: number) {
    onCopy(value)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  function highlight(text: string, q: string) {
    if (!q) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <span>
        {text.slice(0, idx)}
        <span style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '2px', padding: '0 2px' }}>
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </span>
    )
  }

  const isSecret = (key: string) =>
    /secret|password|token|key|api|auth|private|pwd|mail|user|username|email|url|host|server/i.test(key)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{ background: '#090c14', border: '1px solid #0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #0f172a' }}>
          <svg width="15" height="15" fill="none" stroke="#334155" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Tüm projelerde anahtar veya değer ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm"
            style={{ background: 'transparent', color: '#e2e8f0', border: 'none' }}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#0f172a', color: '#334155', border: '1px solid #1e293b' }}>↑↓</kbd>
            <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#0f172a', color: '#334155', border: '1px solid #1e293b' }}>ESC</kbd>
          </div>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg width="28" height="28" fill="none" stroke="#1e293b" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-xs" style={{ color: '#1e293b' }}>Aramak istediğin anahtarı yaz</p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm" style={{ color: '#334155' }}>Sonuç bulunamadı</p>
              <p className="text-xs" style={{ color: '#1e293b' }}>"{query}" ile eşleşen anahtar yok</p>
            </div>
          )}

          {results.map((result, i) => {
            const secret = isSecret(result.entry.key)
            const isCopied = copiedIndex === i
            const isActive = activeIndex === i

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer group transition-all"
                style={{
                  borderBottom: '1px solid #0a0f1a',
                  background: isActive ? '#0a0f1e' : 'transparent',
                }}
                onMouseEnter={(e) => { setActiveIndex(i); e.currentTarget.style.background = '#0a0f1e' }}
                onMouseLeave={(e) => { if (activeIndex !== i) e.currentTarget.style.background = 'transparent' }}
                onClick={() => onNavigate(result.filePath, result.projectId)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#6366f1' }}>{result.projectName}</span>
                    <svg width="10" height="10" fill="none" stroke="#1e293b" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="text-xs" style={{ color: '#1e293b' }}>{result.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      {highlight(result.entry.key, query)}
                    </span>
                    <span style={{ color: '#1e293b', fontSize: '11px' }}>=</span>
                    <span className="text-xs truncate" style={{ color: '#475569' }}>
                      {secret ? '••••••••' : highlight(result.entry.value, query)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(result.entry.value, i) }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all opacity-0 group-hover:opacity-100"
                  style={{
                    background: isCopied ? 'rgba(34,197,94,0.1)' : '#0f172a',
                    color: isCopied ? '#4ade80' : '#334155',
                    border: '1px solid #1e293b',
                  }}
                  title="Değeri kopyala"
                >
                  {isCopied ? (
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}

          {results.length > 0 && (
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs" style={{ color: '#1e293b' }}>{results.length} sonuç</span>
              <span className="text-xs" style={{ color: '#1e293b' }}>Enter ile git</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}