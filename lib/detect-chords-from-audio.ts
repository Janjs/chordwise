import { chroma, chord, smoothChords } from 'pitch-detection'
import { Chord } from 'tonal'
import { capSamplesToMaxDuration } from './audio-recording-limits'
import { decodeWavBase64, decodeWavBuffer } from './decode-wav'
import type { IdentifiedChords } from './audio-chord-analysis'

const FRAME_SIZE = 4096
const HOP_SIZE = 2048
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MIN_CHUNK_SECONDS = 0.45
const MIN_CHUNK_CONFIDENCE = 0.32
const MIN_FRAME_CONFIDENCE = 0.38
const ATTACK_TRIM_RATIO = 0.22
const DECAY_TRIM_RATIO = 0.12
const SILENCE_WINDOW_MS = 40
const CHROMA_CHANGE_THRESHOLD = 0.72
const GUITAR_CHROMA_PARAMS = {
  method: 'nnls' as const,
  harmonics: 6,
  iterations: 40,
}

type ChromaFrame = {
  vector: Float64Array
  startSample: number
}

type ChunkSegment = {
  startFrame: number
  endFrame: number
}

function trimSilence(samples: Float32Array, threshold = 0.01): Float32Array {
  let start = 0
  let end = samples.length - 1

  while (start < samples.length && Math.abs(samples[start]) < threshold) start++
  while (end > start && Math.abs(samples[end]) < threshold) end--

  if (end <= start) return samples

  const padding = Math.min(1024, Math.floor(samples.length * 0.02))
  start = Math.max(0, start - padding)
  end = Math.min(samples.length - 1, end + padding)

  return samples.subarray(start, end + 1)
}

function buildChromaFrames(samples: Float32Array, sampleRate: number): ChromaFrame[] {
  const analysisSamples =
    samples.length >= FRAME_SIZE
      ? samples
      : (() => {
          const padded = new Float32Array(FRAME_SIZE)
          padded.set(samples)
          return padded
        })()

  const frames: ChromaFrame[] = []

  for (let index = 0; index + FRAME_SIZE <= analysisSamples.length; index += HOP_SIZE) {
    frames.push({
      vector: chroma(analysisSamples.subarray(index, index + FRAME_SIZE), {
        fs: sampleRate,
        ...GUITAR_CHROMA_PARAMS,
      }),
      startSample: index,
    })
  }

  if (frames.length === 0) {
    frames.push({
      vector: chroma(analysisSamples.subarray(0, FRAME_SIZE), {
        fs: sampleRate,
        ...GUITAR_CHROMA_PARAMS,
      }),
      startSample: 0,
    })
  }

  return frames
}

function averageChroma(frames: Float64Array[]): Float64Array {
  const mean = new Float64Array(12)
  for (const frame of frames) {
    for (let index = 0; index < 12; index++) mean[index] += frame[index]
  }
  for (let index = 0; index < 12; index++) mean[index] /= frames.length || 1
  return mean
}

function chromaToPitchClasses(chromaVector: Float64Array, relativeThreshold = 0.35): string[] {
  const max = Math.max(...chromaVector)
  if (max === 0) return []

  return NOTE_NAMES.filter((_, index) => chromaVector[index] >= max * relativeThreshold)
}

function simplifyToTriad(name: string): string {
  const parsed = Chord.get(name)
  if (!parsed.tonic) return name

  const isMinor =
    parsed.quality === 'Minor' ||
    parsed.quality === 'Diminished'

  return isMinor ? `${parsed.tonic}m` : parsed.tonic
}

function resolveChordName(chromaVector: Float64Array): { name: string; confidence: number } | null {
  const templateMatch = chord(chromaVector, { minConfidence: 0.25 })
  if (templateMatch.quality !== 'N') {
    return {
      name: templateMatch.label,
      confidence: templateMatch.confidence,
    }
  }

  const tonalMatches = Chord.detect(chromaToPitchClasses(chromaVector), { assumePerfectFifth: true })
  if (tonalMatches.length > 0) {
    return {
      name: simplifyToTriad(tonalMatches[0]),
      confidence: templateMatch.confidence,
    }
  }

  return null
}

function frameEnergy(frame: ChromaFrame, samples: Float32Array): number {
  const start = frame.startSample
  const end = Math.min(start + FRAME_SIZE, samples.length)
  if (end <= start) return 0

  let sum = 0
  for (let index = start; index < end; index++) {
    const value = samples[index]
    sum += value * value
  }

  return Math.sqrt(sum / (end - start))
}

function selectAnalysisFrames(frames: ChromaFrame[], samples: Float32Array): ChromaFrame[] {
  if (frames.length <= 2) return frames

  const attackSkip = Math.floor(frames.length * ATTACK_TRIM_RATIO)
  const decaySkip = Math.floor(frames.length * DECAY_TRIM_RATIO)
  const trimmed = frames.slice(attackSkip, Math.max(attackSkip + 1, frames.length - decaySkip))
  if (trimmed.length === 0) return frames

  const energies = trimmed.map((frame) => frameEnergy(frame, samples))
  const maxEnergy = Math.max(...energies)
  if (maxEnergy === 0) return trimmed

  const energyThreshold = maxEnergy * 0.35
  const stableFrames = trimmed.filter((frame, index) => energies[index] >= energyThreshold)

  return stableFrames.length >= 2 ? stableFrames : trimmed
}

function detectChordInChunk(
  frames: ChromaFrame[],
  samples: Float32Array,
): {
  name: string
  confidence: number
  alternatives: string[]
} | null {
  const analysisFrames = selectAnalysisFrames(frames, samples)
  const vectors = analysisFrames.map((frame) => frame.vector)
  const meanResult = resolveChordName(averageChroma(vectors))
  const votes = new Map<string, number>()

  for (const frame of analysisFrames) {
    const frameResult = resolveChordName(frame.vector)
    if (!frameResult || frameResult.confidence < MIN_FRAME_CONFIDENCE) continue

    const weight = frameResult.confidence * frameEnergy(frame, samples)
    votes.set(frameResult.name, (votes.get(frameResult.name) ?? 0) + weight)
  }

  const rankedVotes = [...votes.entries()].sort((a, b) => b[1] - a[1])
  if (!meanResult && rankedVotes.length === 0) return null

  const topVote = rankedVotes[0]
  const name = topVote?.[0] ?? meanResult!.name

  let winningConfidenceSum = 0
  let winningCount = 0
  for (const frame of analysisFrames) {
    const frameResult = resolveChordName(frame.vector)
    if (frameResult?.name !== name || frameResult.confidence < MIN_FRAME_CONFIDENCE) continue
    winningConfidenceSum += frameResult.confidence
    winningCount++
  }

  const confidence =
    winningCount > 0 ? winningConfidenceSum / winningCount : (meanResult?.confidence ?? topVote?.[1] ?? 0)
  const alternatives = rankedVotes
    .slice(1, 3)
    .map(([label]) => label)
    .filter((label) => label !== name)

  if (confidence < MIN_CHUNK_CONFIDENCE) return null

  return { name, confidence, alternatives }
}

function computeRmsEnvelope(
  samples: Float32Array,
  sampleRate: number,
): Array<{ rms: number; startSample: number }> {
  const windowSize = Math.max(256, Math.floor((sampleRate * SILENCE_WINDOW_MS) / 1000))
  const hopSize = Math.floor(windowSize / 2)
  const envelope: Array<{ rms: number; startSample: number }> = []

  for (let index = 0; index + windowSize <= samples.length; index += hopSize) {
    let sum = 0
    for (let offset = 0; offset < windowSize; offset++) {
      const value = samples[index + offset]
      sum += value * value
    }
    envelope.push({
      rms: Math.sqrt(sum / windowSize),
      startSample: index,
    })
  }

  return envelope
}

function findAudibleSampleSegments(
  samples: Float32Array,
  sampleRate: number,
): Array<{ startSample: number; endSample: number }> {
  const envelope = computeRmsEnvelope(samples, sampleRate)
  if (envelope.length === 0) return []

  const maxRms = Math.max(...envelope.map((entry) => entry.rms))
  if (maxRms === 0) return []

  const windowSize = windowSizeFromSampleRate(sampleRate)
  const threshold = Math.max(0.008, maxRms * 0.1)
  const minSoundWindows = Math.max(2, Math.ceil((MIN_CHUNK_SECONDS * 1000) / SILENCE_WINDOW_MS))
  const segments: Array<{ startSample: number; endSample: number }> = []
  let soundStart = -1

  for (let index = 0; index < envelope.length; index++) {
    const isAudible = envelope[index].rms > threshold

    if (isAudible && soundStart === -1) {
      soundStart = index
    } else if (!isAudible && soundStart !== -1) {
      const soundLength = index - soundStart
      if (soundLength >= minSoundWindows) {
        segments.push({
          startSample: envelope[soundStart].startSample,
          endSample: envelope[index - 1].startSample + windowSize,
        })
      }
      soundStart = -1
    }
  }

  if (soundStart !== -1) {
    const soundLength = envelope.length - soundStart
    if (soundLength >= minSoundWindows) {
      segments.push({
        startSample: envelope[soundStart].startSample,
        endSample: samples.length,
      })
    }
  }

  return segments
}

function audibleSegmentsToFrameSegments(
  audibleSegments: Array<{ startSample: number; endSample: number }>,
  chromaFrameCount: number,
): ChunkSegment[] {
  const segments = audibleSegments
    .map(({ startSample, endSample }) => ({
      startFrame: Math.max(0, Math.floor(startSample / HOP_SIZE)),
      endFrame: Math.min(chromaFrameCount - 1, Math.floor(Math.max(0, endSample - FRAME_SIZE) / HOP_SIZE)),
    }))
    .filter((segment) => segment.endFrame >= segment.startFrame)

  return segments
}

function windowSizeFromSampleRate(sampleRate: number) {
  return Math.max(256, Math.floor((sampleRate * SILENCE_WINDOW_MS) / 1000))
}

function chromaSimilarity(a: Float64Array, b: Float64Array) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let index = 0; index < 12; index++) {
    dot += a[index] * b[index]
    normA += a[index] * a[index]
    normB += b[index] * b[index]
  }
  return dot / (Math.sqrt(normA * normB) + 1e-10)
}

function findChromaChangeFrameSplits(chromaFrames: ChromaFrame[]): number[] {
  if (chromaFrames.length < 4) return []

  const splits: number[] = []
  const windowSize = 3

  for (let index = windowSize; index < chromaFrames.length - windowSize; index++) {
    const before = averageChroma(chromaFrames.slice(index - windowSize, index).map((frame) => frame.vector))
    const after = averageChroma(chromaFrames.slice(index, index + windowSize).map((frame) => frame.vector))
    if (chromaSimilarity(before, after) < CHROMA_CHANGE_THRESHOLD) {
      splits.push(index)
    }
  }

  return splits
}

function frameSplitsToSegments(splitFrames: number[], chromaFrameCount: number): ChunkSegment[] {
  const uniqueSplits = [...new Set(splitFrames.filter((frame) => frame > 0 && frame < chromaFrameCount - 1))].sort(
    (a, b) => a - b,
  )
  const boundaries = [0, ...uniqueSplits, chromaFrameCount]
  const segments: ChunkSegment[] = []

  for (let index = 0; index < boundaries.length - 1; index++) {
    const startFrame = boundaries[index]
    const endFrame = boundaries[index + 1] - 1
    if (endFrame >= startFrame) {
      segments.push({ startFrame, endFrame })
    }
  }

  return segments
}

function findSmoothedLabelSegments(chromaFrames: ChromaFrame[], sampleRate: number): ChunkSegment[] {
  const smoothed = smoothChords(
    chromaFrames.map((frame) => frame.vector),
    { selfProb: 0.75 },
  )
  const minFrames = Math.max(2, Math.ceil((MIN_CHUNK_SECONDS * sampleRate) / HOP_SIZE))
  const rawSegments: Array<ChunkSegment & { label: string }> = []

  for (let index = 0; index < smoothed.length; index++) {
    const smoothedLabel = smoothed[index]
    if (smoothedLabel.quality === 'N' || smoothedLabel.label === 'N') continue

    const last = rawSegments[rawSegments.length - 1]
    if (last && last.label === smoothedLabel.label) {
      last.endFrame = index
    } else {
      rawSegments.push({
        label: smoothedLabel.label,
        startFrame: index,
        endFrame: index,
      })
    }
  }

  return rawSegments.map(({ startFrame, endFrame }) => ({ startFrame, endFrame }))
}

function mergeShortSegments(segments: ChunkSegment[], sampleRate: number): ChunkSegment[] {
  if (segments.length === 0) return []

  const minFrames = Math.max(2, Math.ceil((MIN_CHUNK_SECONDS * sampleRate) / HOP_SIZE))
  const merged: ChunkSegment[] = []

  for (const segment of segments) {
    const frameCount = segment.endFrame - segment.startFrame + 1
    const last = merged[merged.length - 1]

    if (frameCount < minFrames && last) {
      last.endFrame = segment.endFrame
      continue
    }

    merged.push({ ...segment })
  }

  if (merged.length === 0) {
    return [{ startFrame: segments[0].startFrame, endFrame: segments[segments.length - 1].endFrame }]
  }

  const lastSegment = segments[segments.length - 1]
  const final = merged[merged.length - 1]
  if (final.endFrame < lastSegment.endFrame) {
    final.endFrame = lastSegment.endFrame
  }

  return merged
}

function countDistinctSegments(segments: ChunkSegment[]) {
  return segments.filter((segment) => segment.endFrame >= segment.startFrame).length
}

function findChunkSegments(
  samples: Float32Array,
  chromaFrames: ChromaFrame[],
  sampleRate: number,
): ChunkSegment[] {
  const frameCount = chromaFrames.length
  if (frameCount === 0) return []

  const audibleSegments = findAudibleSampleSegments(samples, sampleRate)
  const silenceSegments = audibleSegmentsToFrameSegments(audibleSegments, frameCount)

  if (countDistinctSegments(silenceSegments) > 1) {
    return silenceSegments
  }

  const chromaChangeSegments = mergeShortSegments(
    frameSplitsToSegments(findChromaChangeFrameSplits(chromaFrames), frameCount),
    sampleRate,
  )

  if (countDistinctSegments(chromaChangeSegments) > 1) {
    return chromaChangeSegments
  }

  const labelSegments = mergeShortSegments(findSmoothedLabelSegments(chromaFrames, sampleRate), sampleRate)

  if (countDistinctSegments(labelSegments) > 0) {
    return labelSegments
  }

  return [{ startFrame: 0, endFrame: frameCount - 1 }]
}

function frameToSeconds(frameIndex: number, sampleRate: number, includeWindow = false) {
  const sampleOffset = frameIndex * HOP_SIZE + (includeWindow ? FRAME_SIZE : 0)
  return Math.round((sampleOffset / sampleRate) * 100) / 100
}

function collapseDuplicateChords(
  chords: NonNullable<IdentifiedChords['chords']>,
): NonNullable<IdentifiedChords['chords']> {
  const collapsed: NonNullable<IdentifiedChords['chords']> = []

  for (const entry of chords) {
    const last = collapsed[collapsed.length - 1]
    if (last && last.name === entry.name) {
      last.endSeconds = entry.endSeconds
      last.confidence = Math.max(last.confidence ?? 0, entry.confidence ?? 0)
      continue
    }
    collapsed.push({ ...entry })
  }

  return collapsed
}

export function detectChordsFromSamples(samples: Float32Array, sampleRate: number): IdentifiedChords {
  const trimmed = trimSilence(capSamplesToMaxDuration(samples, sampleRate))
  const chromaFrames = buildChromaFrames(trimmed, sampleRate)
  const chunkSegments = findChunkSegments(trimmed, chromaFrames, sampleRate)
  const detectedChunks = []

  for (const segment of chunkSegments) {
    const chunkFrames = chromaFrames.slice(segment.startFrame, segment.endFrame + 1)
    const detected = detectChordInChunk(chunkFrames, trimmed)
    if (!detected) continue

    detectedChunks.push({
      name: detected.name,
      confidence: Math.round(detected.confidence * 100) / 100,
      startSeconds: frameToSeconds(segment.startFrame, sampleRate),
      endSeconds: frameToSeconds(segment.endFrame, sampleRate, true),
      alternativeNames: detected.alternatives.length > 0 ? detected.alternatives : undefined,
    })
  }

  const chords = collapseDuplicateChords(detectedChunks)

  if (chords.length === 0) {
    const fallback = detectChordInChunk(chromaFrames, trimmed)
    if (!fallback) {
      return {
        chords: [],
        summary: 'No clear chord could be detected in this recording.',
        notes: 'Try recording closer to the guitar with a full strum and less background noise.',
      }
    }

    return {
      chords: [
        {
          name: fallback.name,
          confidence: Math.round(fallback.confidence * 100) / 100,
          startSeconds: 0,
          endSeconds: frameToSeconds(chromaFrames.length - 1, sampleRate, true),
          alternativeNames: fallback.alternatives.length > 0 ? fallback.alternatives : undefined,
        },
      ],
      summary: `Detected ${fallback.name} from the recording.`,
      notes:
        fallback.confidence < 0.55
          ? 'Confidence is moderate. Try a fuller strum closer to the microphone.'
          : undefined,
    }
  }

  const lowConfidence = chords.some((entry) => (entry.confidence ?? 0) < 0.55)

  return {
    chords,
    summary:
      chords.length === 1
        ? `Detected ${chords[0].name} from the recording.`
        : `Detected ${chords.map((entry) => entry.name).join(' → ')}.`,
    notes: lowConfidence
      ? 'Some sections have moderate confidence. Pause briefly between chord changes for clearer results.'
      : undefined,
  }
}

export function detectChordsFromWavBuffer(buffer: Buffer): IdentifiedChords {
  const { samples, sampleRate } = decodeWavBuffer(buffer)
  return detectChordsFromSamples(samples, sampleRate)
}

export function detectChordsFromWavBase64(base64: string): IdentifiedChords {
  const { samples, sampleRate } = decodeWavBase64(base64)
  return detectChordsFromSamples(samples, sampleRate)
}
