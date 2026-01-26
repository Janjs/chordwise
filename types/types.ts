export type Progression = {
  chords: Chord[]
}

export type Chord = {
  representation: string
  midi: number[]
}

export interface GenerateProgressionsRequest {
  prompt: string
}

export interface GenerateProgressionsResponse {
  error?: string
  progressions?: Progression[]
}
