import { ChatCompletionResponseMessage } from 'openai'

export interface ChordProgression {
  chords: Chord[]
}

export interface Chord {
  representation: string
  key: string
  suffix: string
}
