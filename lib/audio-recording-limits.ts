export const MAX_RECORDING_MS = 10_000
export const MAX_RECORDING_SECONDS = MAX_RECORDING_MS / 1000

export function capSamplesToMaxDuration(samples: Float32Array, sampleRate: number): Float32Array {
  const maxSamples = Math.floor(MAX_RECORDING_SECONDS * sampleRate)
  if (samples.length <= maxSamples) return samples
  return samples.subarray(0, maxSamples)
}
