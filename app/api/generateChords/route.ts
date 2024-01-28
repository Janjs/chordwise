import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { Progression } from '@/types/types'
import { NextResponse } from 'next/server'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'

const MOCK = process.env.MOCK_API === 'false' || true

const openai = new OpenAI()

export interface GenerateProgressionsRequest {
  description: string
  musicalKey: string
  musicalScale: string
}

export async function POST(req: Request) {
  if (MOCK) return NextResponse.json({ progressions: parseProgressions(MOCK_DATA) })
  // if (MOCK) return NextResponse.json(MOCK_DATA_2)

  const userInput: GenerateProgressionsRequest = await req.json()

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

  return NextResponse.json({ progressions: parseProgressions(response) })
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

const MOCK_DATA = {
  chord_progressions: [
    ['G', 'Fm7', 'Dm7b5', 'G7'],
    ['Dm7b5', 'G7', 'Cm7', 'Abmaj7'],
    ['Gm7', 'Cm7', 'Fm7', 'Bb7'],
    ['Cm7', 'Ebmaj7', 'Abmaj7', 'G7'],
    ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7'],
  ],
}
