import { useState, useEffect } from 'react'
import type { EnvFile, EnvEntry } from '../shared/types'

interface Props {
  file: EnvFile
  onSave: (entries: EnvEntry[]) => void
  onCopy: (text: string) => void
}

export default function EnvEditor({ file, onSave, onCopy }: Props) {
  const [entries, setEntries] = useState<EnvEntry[]>(file.entries)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    setEntries(file.entries)
    setRevealed(new Set())
    setDirty(false)
    setSaved(false)
    setSearch('')
  }, [file.path])

  function toggleReveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function updateEntry(index: number, field: keyof EnvEntry, value: string | boolean) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
    setDirty(true)
    setSaved(false)
  }

  function addEntry() {
    setEntries((prev) => [...prev, { key: '', value: '', enabled: true }])
    setDirty(true)
  }

  function deleteEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
    setSaved(false)
  }

  function handleSave() {
    onSave(entries)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopy(value: string, idx: number) {
    onCopy(value)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const isSecret = (key: string) =>
    /secret|password|token|key|api|auth|private|pwd|mail|user|username|email|url|host|server/i.test(key)

  const filtered = entries
    .map((e, i) => ({ ...e, originalIndex: i }))
    .filter((e) =>
      search
        ? e.key.toLowerCase().includes(search.toLowerCase()) ||
          e.value.toLowerCase().includes(search.toLowerCase())
        : true
    )

  return (
    <div className="flex flex-col h-full" style={{ background: '#080b12' }}>

      <div className="flex items-center gap-3 px-6 py-3.5" style={{ borderBottom: '1px solid #0f172a', background: '#090c14' }}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <svg width="13" height="13" fill="none" stroke="#818cf8" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 leading-none mb-0.5">{file.filename}</p>
            <p className="text-xs truncate" style={{ color: '#1e293b' }}>{file.path}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <svg width="12" height="12" fill="none" stroke="#334155" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Filtrele..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs w-28"
              style={{ background: 'transparent', color: '#94a3b8', border: 'none' }}
            />
          </div>

          <button
            onClick={addEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: '#0f172a', color: '#475569', border: '1px solid #1e293b' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#1e293b' }}
          >
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ekle
          </button>

          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: saved
                ? 'rgba(34,197,94,0.12)'
                : dirty
                ? 'rgba(99,102,241,0.9)'
                : '#0f172a',
              color: saved ? '#4ade80' : dirty ? 'white' : '#1e293b',
              border: saved ? '1px solid rgba(34,197,94,0.2)' : dirty ? '1px solid transparent' : '1px solid #1e293b',
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            {saved ? (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Kaydedildi
              </>
            ) : (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-2 px-6 py-2.5" style={{ gridTemplateColumns: '2fr 3fr 72px', borderBottom: '1px solid #0a0f1e', background: '#090c14' }}>
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1e293b', fontSize: '10px' }}>Anahtar</span>
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1e293b', fontSize: '10px' }}>Değer</span>
        <span className="text-xs font-medium tracking-widest uppercase text-right" style={{ color: '#1e293b', fontSize: '10px' }}>İşlem</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg width="24" height="24" fill="none" stroke="#1e293b" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-xs" style={{ color: '#1e293b' }}>
              {search ? 'Eşleşen anahtar bulunamadı' : 'Dosya boş'}
            </p>
          </div>
        )}

        {filtered.map((entry) => {
          const idx = entry.originalIndex
          const isRevealed = revealed.has(idx)
          const secret = isSecret(entry.key)
          const isCopied = copiedIndex === idx

          return (
            <div
              key={idx}
              className="grid gap-2 px-6 py-2.5 items-center group transition-all"
              style={{
                gridTemplateColumns: '2fr 3fr 72px',
                borderBottom: '1px solid #0a0f1e',
                opacity: entry.enabled ? 1 : 0.35,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0a0f1a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <input
                type="text"
                value={entry.key}
                onChange={(e) => updateEntry(idx, 'key', e.target.value)}
                className="text-xs font-mono px-2 py-1.5 rounded-md w-full transition-all"
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid transparent',
                }}
                onFocus={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.borderColor = '#1e293b' }}
                onBlur={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                placeholder="KEY_NAME"
              />

              <div className="flex items-center gap-1.5">
                <input
                  type={secret && !isRevealed ? 'password' : 'text'}
                  value={entry.value}
                  onChange={(e) => updateEntry(idx, 'value', e.target.value)}
                  className="text-xs font-mono px-2 py-1.5 rounded-md flex-1 min-w-0 transition-all"
                  style={{
                    background: 'transparent',
                    color: secret && !isRevealed ? '#334155' : '#64748b',
                    border: '1px solid transparent',
                  }}
                  onFocus={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8' }}
                  onBlur={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                  placeholder="value"
                />
                {secret && (
                  <button
                    onClick={() => toggleReveal(idx)}
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors"
                    style={{ color: isRevealed ? '#6366f1' : '#1e293b' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.color = isRevealed ? '#6366f1' : '#1e293b')}
                  >
                    {isRevealed ? (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleCopy(entry.value, idx)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: isCopied ? '#4ade80' : '#334155' }}
                  onMouseEnter={e => { if (!isCopied) e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={e => { if (!isCopied) e.currentTarget.style.color = '#334155' }}
                  title="Kopyala"
                >
                  {isCopied ? (
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => updateEntry(idx, 'enabled', !entry.enabled)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: entry.enabled ? '#334155' : '#f59e0b' }}
                  onMouseEnter={e => { if (entry.enabled) e.currentTarget.style.color = '#f59e0b' }}
                  onMouseLeave={e => { if (entry.enabled) e.currentTarget.style.color = '#334155' }}
                  title={entry.enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </button>

                <button
                  onClick={() => deleteEntry(idx)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: '#334155' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                  title="Sil"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}