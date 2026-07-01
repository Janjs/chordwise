declare module 'pitch-detection' {
  export function chroma(
    data: Float32Array | Float64Array,
    params?: {
      fs?: number
      method?: 'pcp' | 'nnls'
      minFreq?: number
      maxFreq?: number
      harmonics?: number
      iterations?: number
    },
  ): Float64Array

  export function chord(
    chromaVec: Float64Array | Float32Array | number[],
    params?: { minConfidence?: number },
  ): {
    root: number
    quality: 'maj' | 'min' | 'N'
    label: string
    confidence: number
  }

  export function smoothChords(
    frames: Array<Float64Array | Float32Array | number[]>,
    params?: { selfProb?: number },
  ): Array<{ root: number; quality: 'maj' | 'min' | 'N'; label: string }>
}
