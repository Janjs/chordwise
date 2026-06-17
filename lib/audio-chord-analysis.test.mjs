import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const outfile = join(tmpdir(), `audio-chord-analysis-${Date.now()}.mjs`)

await build({
  entryPoints: ['lib/audio-chord-analysis.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
})

const { parseIdentifiedChords } = await import(pathToFileURL(outfile).href)

test('parseIdentifiedChords converts detected chords into a Chordwise progression', () => {
  const result = parseIdentifiedChords({
    chords: [
      { name: 'Em', confidence: 0.92 },
      { name: 'Cadd9', confidence: 0.71 },
      { name: ' ', confidence: 0.2 },
      { name: 'G', confidence: 0.87 },
    ],
    summary: 'Likely open-position guitar chords.',
  })

  assert.deepEqual(
    result.progression.chords.map((chord) => chord.representation),
    ['Em', 'Cadd9', 'G'],
  )
  assert.equal(result.summary, 'Likely open-position guitar chords.')
  assert.ok(result.progression.chords[0].midi.length > 0)
})
