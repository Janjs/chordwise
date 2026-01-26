'use server'

import { GenerateProgressionsRequest, GenerateProgressionsResponse, Progression, Suggestion } from '@/types/types'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { redirect } from 'next/navigation'
import { GITHUB_LINK } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import path from 'path'

const MOCK = false

const ChordProgressionsSchema = z.object({
  chord_progressions: z.array(z.array(z.string())).describe('5 chord progressions, each as an array of chord names'),
})

export const generateChordProgressions = async (
  userInput: GenerateProgressionsRequest,
): Promise<GenerateProgressionsResponse> => {
  if (userInput.suggestionIndex !== undefined) return await getSuggestion(userInput.suggestionIndex)

  if (MOCK) return { progressions: parseProgressions(MOCK_DATA) }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ChordProgressionsSchema,
      prompt: `Generate 5 chord progressions based on the user's request. Each progression should be an array of chord names (e.g., "Am", "Dm7", "G7", "Cmaj7").\n\n${createUserPrompt(userInput)}`,
    })

    if (!object || !object.chord_progressions) {
      return { error: 'Error while generating chord progressions.' }
    }

    const parsedProgressions = parseProgressions(object)

    return { progressions: parsedProgressions }
  } catch (error: any) {
    return { error: error.message || 'Error while generating chord progressions.' }
  }
}

const parseProgressions = (data: z.infer<typeof ChordProgressionsSchema>): Progression[] => {
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

  // Manually add octave 3 to each note since getChord doesn't include octaves
  const notesWithOctave = chordInfo.notes.map((note) => note + '3')

  const midis: number[] = notesWithOctave
    .map((note) => TonalMidi.toMidi(note) as number)
    .filter((midi) => midi != null)

  return midis
}

const getSuggestion = async (suggestionIndex: number) => {
  const suggestionsFile = readFileSync(path.join(process.cwd(), 'public', 'suggestions.json'), 'utf8')
  const suggestions: Suggestion[] = JSON.parse(suggestionsFile)

  const suggestion = suggestions[suggestionIndex]

  return { progressions: suggestion.progressions as Progression[] }
}

const createUserPrompt = (userInput: GenerateProgressionsRequest): string => {
  if (userInput.musicalKey === 'Key') {
    return `Generate chord progressions that fit the following description: ${userInput.description}`
  } else {
    return `Generate chord progressions in the key of ${userInput.musicalKey + userInput.musicalScale
      }, that fit the following description: ${userInput.description}`
  }
}

const MOCK_DATA = {
  chord_progressions: [
    ['G', 'Fm7', 'Dm7b5', 'G7'],
    ['Dm7b5', 'G7', 'Cm7'],
    ['Gm7', 'Cm7', 'Fm7', 'Bb7', 'C'],
    ['Cm7', 'Ebmaj7', 'Abmaj7', 'G7'],
    ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7'],
  ],
}

export const navigateToGithub = async () => {
  redirect(GITHUB_LINK)
}

export const reGenerate = async () => {
  revalidatePath('/')
}
