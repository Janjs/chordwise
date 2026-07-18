import assert from 'node:assert/strict'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const outfile = join(tmpdir(), `upload-recording-${Date.now()}.mjs`)

await build({
  entryPoints: ['lib/upload-recording.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
})

const { AUDIO_UPLOAD_MAX_BYTES, uploadAudioSourceToConvex } = await import(pathToFileURL(outfile).href)

test('audio upload limit fits serverless proxy uploads', () => {
  assert.equal(AUDIO_UPLOAD_MAX_BYTES, 4 * 1024 * 1024)
})

test('uploadAudioSourceToConvex posts audio to same-origin upload route', async () => {
  const calls = []
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })

    if (String(url).startsWith('data:')) {
      return originalFetch(url, init)
    }

    if (url === '/api/recordings/upload') {
      return Response.json({
        id: 'pending123',
        url: 'https://storage.example/audio.wav',
        storageId: 'storage123',
      })
    }

    throw new Error(`unexpected fetch: ${url}`)
  }

  try {
    const result = await uploadAudioSourceToConvex({
      audioUrl: 'data:audio/wav;base64,UklGRg==',
      sessionId: 'session123',
      prompt: 'What chords am I playing?',
      filename: 'take.wav',
    })

    assert.equal(result.id, 'pending123')
    assert.equal(calls[1].url, '/api/recordings/upload')
    assert.equal(calls[1].init.method, 'POST')
    assert.equal(calls[1].init.headers['Content-Type'], 'audio/wav')
    assert.equal(calls[1].init.headers['x-chordwise-session-id'], 'session123')
    assert.equal(calls[1].init.headers['x-chordwise-filename'], 'take.wav')
    assert.equal(calls[1].init.headers['x-chordwise-prompt'], 'What%20chords%20am%20I%20playing%3F')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('uploadAudioSourceToConvex explains upload size failures', async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('data:')) {
      return originalFetch(url, init)
    }

    return Response.json({ error: 'Request Entity Too Large' }, { status: 413 })
  }

  try {
    await assert.rejects(
      uploadAudioSourceToConvex({
        audioUrl: 'data:audio/wav;base64,UklGRg==',
        sessionId: 'session123',
      }),
      /Recording is too large/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
