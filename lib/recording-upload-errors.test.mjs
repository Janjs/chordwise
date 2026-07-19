import assert from 'node:assert/strict'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const outfile = join(tmpdir(), `recording-upload-errors-${Date.now()}.mjs`)

await build({
  entryPoints: ['lib/recording-upload-errors.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
})

const {
  describeUploadUrl,
  getResponseErrorText,
  getStorageUploadFailureMessage,
} = await import(pathToFileURL(outfile).href)

test('getResponseErrorText preserves upstream JSON error messages', async () => {
  const response = Response.json({ error: 'Storage is not configured.' }, { status: 500 })

  assert.equal(await getResponseErrorText(response), 'Storage is not configured.')
})

test('getStorageUploadFailureMessage includes upstream status', () => {
  assert.equal(
    getStorageUploadFailureMessage(500, 'Internal Server Error', 'Storage is not configured.'),
    'Convex storage upload failed (500 Internal Server Error): Storage is not configured.',
  )
})

test('describeUploadUrl strips signed query parameters', () => {
  assert.deepEqual(
    describeUploadUrl('https://backend.example.com/api/storage/upload?token=secret'),
    {
      origin: 'https://backend.example.com',
      pathname: '/api/storage/upload',
    },
  )
})
