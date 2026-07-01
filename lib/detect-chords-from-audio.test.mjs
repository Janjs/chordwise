import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

function encodeWav(samples, sampleRate) {
  const channelCount = 1
  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const dataSize = samples.length * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += bytesPerSample
  }

  return Buffer.from(buffer)
}

function synthesizeTriad(frequencies, sampleRate, seconds = 2) {
  const length = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(length)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const envelope = Math.min(1, t * 8) * Math.max(0, 1 - (t - 0.2) * 1.5)
    let value = 0
    for (const frequency of frequencies) {
      value += Math.sin(2 * Math.PI * frequency * t)
      value += 0.45 * Math.sin(2 * Math.PI * frequency * 2 * t)
      value += 0.2 * Math.sin(2 * Math.PI * frequency * 3 * t)
    }
    samples[i] = (value / frequencies.length) * envelope
  }

  return samples
}

const outfile = join(tmpdir(), `detect-chords-from-audio-${Date.now()}.mjs`)

await build({
  entryPoints: ['lib/detect-chords-from-audio.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
})

const { detectChordsFromSamples, detectChordsFromWavBuffer } = await import(pathToFileURL(outfile).href)

test('detectChordsFromSamples identifies an A minor triad', () => {
  const sampleRate = 44100
  const samples = synthesizeTriad([220, 261.63, 329.63], sampleRate)
  const result = detectChordsFromSamples(samples, sampleRate)

  assert.ok(result.chords.length > 0)
  assert.equal(result.chords[0].name, 'Am')
})

test('detectChordsFromSamples identifies a G major triad', () => {
  const sampleRate = 44100
  const samples = synthesizeTriad([392, 493.88, 587.33], sampleRate)
  const result = detectChordsFromSamples(samples, sampleRate)

  assert.ok(result.chords.length > 0)
  assert.equal(result.chords[0].name, 'G')
})

test('detectChordsFromSamples identifies chord chunks in a progression', () => {
  const sampleRate = 44100
  const amSamples = synthesizeTriad([220, 261.63, 329.63], sampleRate, 1.2)
  const gSamples = synthesizeTriad([392, 493.88, 587.33], sampleRate, 1.2)
  const combined = new Float32Array(amSamples.length + gSamples.length)
  combined.set(amSamples, 0)
  combined.set(gSamples, amSamples.length)

  const result = detectChordsFromSamples(combined, sampleRate)

  assert.ok(result.chords.length >= 2)
  assert.equal(result.chords[0].name, 'Am')
  assert.equal(result.chords[1].name, 'G')
})

test('detectChordsFromSamples splits chords separated by silence', () => {
  const sampleRate = 44100
  const amSamples = synthesizeTriad([220, 261.63, 329.63], sampleRate, 1)
  const silence = new Float32Array(Math.floor(sampleRate * 0.35))
  const gSamples = synthesizeTriad([392, 493.88, 587.33], sampleRate, 1)
  const combined = new Float32Array(amSamples.length + silence.length + gSamples.length)
  combined.set(amSamples, 0)
  combined.set(silence, amSamples.length)
  combined.set(gSamples, amSamples.length + silence.length)

  const result = detectChordsFromSamples(combined, sampleRate)

  assert.ok(result.chords.length >= 2)
  assert.equal(result.chords[0].name, 'Am')
  assert.equal(result.chords[1].name, 'G')
})

test('detectChordsFromWavBuffer decodes wav input', () => {
  const sampleRate = 44100
  const samples = synthesizeTriad([220, 261.63, 329.63], sampleRate)
  const wav = encodeWav(samples, sampleRate)
  const result = detectChordsFromWavBuffer(wav)

  assert.equal(result.chords[0]?.name, 'Am')
})
