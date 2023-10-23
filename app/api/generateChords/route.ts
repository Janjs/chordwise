import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ChordProgression } from '@/types/types'
import { NextResponse } from 'next/server'

const MOCK = true

const openai = new OpenAI()

export interface GenerateChordsRequest {
  description: string
  musicalKey: string
  musicalScale: string
}

const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: 'generate',
    description: 'generate chord progressions',
    parameters: {
      name: 'chord_progressions',
      type: 'object',
      description: 'Chord progressions',
      properties: {
        chord_progressions: {
          type: 'array',
          items: {
            type: 'array',
            description: 'Chord progression',
            items: {
              name: 'chord',
              type: 'object',
              description: 'chord',
              properties: {
                chord: {
                  type: 'string',
                  description: 'chord',
                },
                root: {
                  type: 'string',
                  description: 'the root note of the chord',
                },
              },
              required: ['chord', 'root'],
            },
          },
        },
      },
      required: ['chord_progressions'],
    },
  },
]

export async function POST(req: Request) {
  if (MOCK) return NextResponse.json(MOCK_DATA)

  const userInput: GenerateChordsRequest = await req.json()

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'Generate 5 chord progressions. The chord progressions have to fit a user-provided description and key',
    },
    {
      role: 'user',
      content: `Generate chord progressions in the key of ${
        userInput.musicalKey + userInput.musicalScale
      }, that fit the following description: ${userInput.description}`,
    },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    functions: functions,
  })
  const message = completion.choices[0]!.message
  messages.push(message)

  if (!message.function_call) {
    return NextResponse.json({})
  }

  console.log(message.function_call.arguments)

  const response = JSON.parse(message.function_call.arguments)['chord_progressions']

  const chordProgressions: ChordProgression[] = []

  for (let chordProgResponse of response) {
    let structuredChordResponse = []
    for (let chordResponse of chordProgResponse) {
      structuredChordResponse.push({
        representation: chordResponse.chord,
        root: chordResponse.root,
      })
    }
    chordProgressions.push({ chords: structuredChordResponse })
  }

  return NextResponse.json({ chordProgressions: chordProgressions })
}

const MOCK_DATA = {
  chordProgressions: [
    {
      chords: [
        { representation: 'C', root: 'G' },
        { representation: 'G', root: 'G' },
        { representation: 'F', root: 'F' },
        { representation: 'A#', root: 'A#' },
      ],
    },
    {
      chords: [
        { representation: 'Dm', root: 'D' },
        { representation: 'G', root: 'G' },
        { representation: 'A#', root: 'A#' },
        { representation: 'C', root: 'C' },
      ],
    },
    {
      chords: [
        { representation: 'F', root: 'F' },
        { representation: 'A#', root: 'A#' },
        { representation: 'G', root: 'G' },
        { representation: 'Dm', root: 'D' },
      ],
    },
    {
      chords: [
        { representation: 'G', root: 'G' },
        { representation: 'A#', root: 'A#' },
        { representation: 'F', root: 'F' },
        { representation: 'C', root: 'C' },
      ],
    },
    {
      chords: [
        { representation: 'A#', root: 'A#' },
        { representation: 'C', root: 'C' },
        { representation: 'G', root: 'G' },
        { representation: 'Dm', root: 'D' },
      ],
    },
  ],
}
