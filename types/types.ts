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
}

export interface GenerateProgressionsResponse {
  error?: string
  progressions?: Progression[]
}
