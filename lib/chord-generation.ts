import { Progression } from '@/types/types'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'
import { z } from 'zod'

export const ChordProgressionsSchema = z.object({
  chord_progressions: z.array(z.array(z.string())).describe('5 chord progressions, each as an array of chord names'),
})

export const parseProgressions = (data: z.infer<typeof ChordProgressionsSchema>): Progression[] => {
  const parsedProgressions = data.chord_progressions.map((progression) => ({
    chords: progression.map((chordName) => ({ representation: chordName, midi: getProgressionMidis(chordName) })),
  }))

  return parsedProgressions as Progression[]
}

const getProgressionMidis = (representation: string) => {
  const chordInfo = TonalChord.get(representation)

  if (!chordInfo.notes || chordInfo.notes.length === 0) {
    return []
  }

  const notesWithOctave = chordInfo.notes.map((note) => note + '3')

  const midis: number[] = notesWithOctave
    .map((note) => TonalMidi.toMidi(note) as number)
    .filter((midi) => midi != null)

  return midis
}
