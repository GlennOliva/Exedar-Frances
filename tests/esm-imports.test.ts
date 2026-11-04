import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const runtimeRoots = ['api', 'server', 'shared']
const relativeImport = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : []
  })
}

describe('Node ESM import specifiers', () => {
  it('uses emitted .js paths for every relative runtime import', () => {
    const offenders = runtimeRoots.flatMap((root) => sourceFiles(root).flatMap((path) => {
      const source = readFileSync(path, 'utf8')
      return [...source.matchAll(relativeImport)]
        .map((match) => match[1])
        .filter((specifier) => !specifier.endsWith('.js'))
        .map((specifier) => `${path} -> ${specifier}`)
    }))

    expect(offenders).toEqual([])
  })
})
