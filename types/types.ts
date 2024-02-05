export type Progression = {
  chords: Chord[]
}

export type Chord = {
  representation: string
  midi: number[]
}

export interface GenerateProgressionsRequest {
  description: string
  musicalKey: string
  musicalScale: string
  suggestionIndex?: number
}

export interface GenerateProgressionsResponse {
  error?: string
  progressions?: Progression[]
}

export interface Suggestion {
  key: number
  description: string
  musicalKey: string
  musicalScale: string
  progressions: Progression[]
}
