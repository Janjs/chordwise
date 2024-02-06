'use server'

import { GenerateProgressionsRequest, GenerateProgressionsResponse, Progression, Suggestion } from '@/types/types'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { redirect } from 'next/navigation'
import { GITHUB_LINK } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import path from 'path'

const MOCK = false

const openai = new OpenAI()

export const generateChordProgressions = async (
  userInput: GenerateProgressionsRequest,
): Promise<GenerateProgressionsResponse> => {
  if (userInput.suggestionIndex !== undefined) return await getSuggestion(userInput.suggestionIndex)

  if (MOCK) return { progressions: parseProgressions(MOCK_DATA) }

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `
          Analyze the following query and return 5 valid json objects corresponding to these rules:

          "chord_progressions":
          Generate 5 chord progressions, each chord progression will consist in an array of each chord.
      `,
    },
    {
      role: 'user',
      content: createUserPrompt(userInput),
    },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: messages,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0]!.message?.content!)

  if (!response || response === '' || !response.chord_progressions) {
    return { error: 'Error while generating chord progressions.' }
  }

  const parsedProgressions = parseProgressions(response)

  console.log(JSON.stringify(parsedProgressions))

  return { progressions: parsedProgressions }
}

const parseProgressions = (data: typeof MOCK_DATA): Progression[] => {
  const parsedProgressions = data.chord_progressions.map((progression) => ({
    chords: progression.map((chordName) => ({ representation: chordName, midi: getProgressionMidis(chordName) })),
  }))

  return parsedProgressions as Progression[]
}

const getProgressionMidis = (representation: string) => {
  const chordInfo = TonalChord.get(representation)

  const notes =
    chordInfo.tonic != null
      ? TonalChord.getChord(chordInfo.type, chordInfo.tonic + 0).notes
      : chordInfo.notes.map((note) => note + 0)

  const midis: number[] = notes.map((note) => TonalMidi.toMidi(note) as number).filter((note) => !!note)

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
    return `Generate chord progressions in the key of ${
      userInput.musicalKey + userInput.musicalScale
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

export const reGenerate = () => {
  revalidatePath('/')
}
