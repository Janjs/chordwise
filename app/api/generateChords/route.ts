import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ChordProgression } from '@/types/types'
import { NextResponse } from 'next/server'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'

const MOCK = true

const openai = new OpenAI()

export interface GenerateChordsRequest {
  description: string
  musicalKey: string
  musicalScale: string
}

export async function POST(req: Request) {
  //if (MOCK) return NextResponse.json({ chordProgressions: parseChordProgressions(MOCK_DATA) })
  if (MOCK) return NextResponse.json(MOCK_DATA_2)

  const userInput: GenerateChordsRequest = await req.json()

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
      content: `Generate chord progressions in the key of ${
        userInput.musicalKey + userInput.musicalScale
      }, that fit the following description: ${userInput.description}`,
    },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: messages,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0]!.message?.content!)

  if (!response || response === '') {
    throw new Error('Error while generating chord progressions.')
  }

  return NextResponse.json({ chordProgressions: parseChordProgressions(response) })
}

const parseChordProgressions = (data: typeof MOCK_DATA): ChordProgression[] => {
  const parsedChordProgression = data.chord_progressions.map((progression) => ({
    chords: progression.map((chord) => ({ representation: chord })),
  }))
  return parsedChordProgression as ChordProgression[]
}

const MOCK_DATA = {
  chord_progressions: [
    ['Cm7', 'Fm7', 'Dm7b5', 'G7'],
    ['Dm7b5', 'G7', 'Cm7', 'Abmaj7'],
    ['Gm7', 'Cm7', 'Fm7', 'Bb7'],
    ['Cm7', 'Ebmaj7', 'Abmaj7', 'G7'],
    ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7'],
  ],
}

const MOCK_DATA_2 = {
  chordProgressions: [
    {
      chords: [{ representation: 'G5' }, { representation: 'C' }, { representation: 'F' }, { representation: 'A#' }],
    },
    {
      chords: [{ representation: 'Dm' }, { representation: 'G' }, { representation: 'A#' }, { representation: 'C' }],
    },
    {
      chords: [{ representation: 'F' }, { representation: 'A#' }, { representation: 'G' }, { representation: 'Dm' }],
    },
    {
      chords: [{ representation: 'G' }, { representation: 'A#' }, { representation: 'F' }, { representation: 'C' }],
    },
    {
      chords: [{ representation: 'A#' }, { representation: 'C' }, { representation: 'G' }, { representation: 'Dm' }],
    },
  ],
}
