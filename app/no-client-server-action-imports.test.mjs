import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
const sourceDirectories = ['app', 'components', 'hooks', 'lib']

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      yield* walk(path)
    } else if (extensions.has(path.slice(path.lastIndexOf('.')))) {
      yield path
    }
  }
}

test('client components do not import app server actions', () => {
  const offenders = []

  for (const directory of sourceDirectories) {
    for (const path of walk(join(root, directory))) {
      const source = readFileSync(path, 'utf8')
      if (!source.startsWith("'use client'") && !source.startsWith('"use client"')) continue

      if (/from\s+['"](?:@\/app\/_actions|\.\/_actions|\.\.\/_actions)['"]/.test(source)) {
        offenders.push(relative(root, path))
      }
    }
  }

  assert.deepEqual(offenders, [])
})
