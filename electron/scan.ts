import fs from 'node:fs'
import path from 'node:path'
import { parseEnvFile } from '../src/shared/parser'
import type { EnvFile } from '../src/shared/types'

const ENV_PATTERNS = /^\.env(\..+)?$/

export function scanFolder(folderPath: string): EnvFile[] {
  const results: EnvFile[] = []

  function walk(dir: string, depth: number = 0) {
    if (depth > 5) return

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.isDirectory()) continue
      if (entry.name === 'node_modules') continue
      if (entry.name === '.git') continue

      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath, depth + 1)
      } else if (entry.isFile() && ENV_PATTERNS.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const entries = parseEnvFile(content)
          results.push({
            filename: entry.name,
            path: fullPath,
            entries,
          })
        } catch {
          // Okunamayan dosyayı atla
        }
      }
    }
  }

  walk(folderPath)
  return results
}

export function readEnvFile(filePath: string): EnvFile {
  const content = fs.readFileSync(filePath, 'utf-8')
  const entries = parseEnvFile(content)
  return {
    filename: path.basename(filePath),
    path: filePath,
    entries,
  }
}

export function writeEnvFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8')
}