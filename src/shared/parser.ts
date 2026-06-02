import type { EnvEntry } from './types'

export function parseEnvFile(content: string): EnvEntry[] {
  const lines = content.split(/\r?\n/)
  const entries: EnvEntry[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) continue

    if (trimmed.startsWith('#')) {
      const rest = trimmed.slice(1).trim()
      const eqIndex = rest.indexOf('=')
      if (eqIndex !== -1) {
        const key = rest.slice(0, eqIndex).trim()
        const rawVal = rest.slice(eqIndex + 1).trim()
        if (key && !key.includes(' ')) {
          entries.push({
            key,
            value: stripQuotes(rawVal),
            enabled: false,
          })
          continue
        }
      }
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const rest = trimmed.slice(eqIndex + 1)

    const { value, comment } = splitValueComment(rest)

    entries.push({
      key,
      value: stripQuotes(value.trim()),
      comment: comment || undefined,
      enabled: true,
    })
  }

  return entries
}

export function serializeEnvFile(entries: EnvEntry[]): string {
  return entries
    .map((e) => {
      const val = needsQuotes(e.value) ? `"${e.value}"` : e.value
      const comment = e.comment ? ` # ${e.comment}` : ''
      const line = `${e.key}=${val}${comment}`
      return e.enabled ? line : `# ${line}`
    })
    .join('\n') + '\n'
}

function stripQuotes(val: string): string {
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    return val.slice(1, -1)
  }
  return val
}

function needsQuotes(val: string): boolean {
  return val.includes(' ') || val.includes('#') || val.includes('"')
}

function splitValueComment(raw: string): { value: string; comment: string } {
  if (raw.startsWith('"')) {
    const closeQ = raw.indexOf('"', 1)
    if (closeQ !== -1) {
      const after = raw.slice(closeQ + 1)
      const cIdx = after.indexOf('#')
      return {
        value: raw.slice(0, closeQ + 1),
        comment: cIdx !== -1 ? after.slice(cIdx + 1).trim() : '',
      }
    }
  }
  const cIdx = raw.indexOf('#')
  if (cIdx === -1) return { value: raw, comment: '' }
  return {
    value: raw.slice(0, cIdx),
    comment: raw.slice(cIdx + 1).trim(),
  }
}