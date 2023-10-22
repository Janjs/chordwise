import OpenAI from 'openai'
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources/chat'
import { Chord, ChordProgression } from '@/types/types'
import { NextResponse } from 'next/server'

export interface GenerateChordsRequest {
  description: string
  musicalKey: string
  musicalScale: string
}

const openai = new OpenAI()

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
              },
              required: ['chord'],
            },
          },
        },
      },
      required: ['chord_progressions'],
    },
  },
]

export async function POST(req: Request) {
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

  const response = JSON.parse(message.function_call.arguments)['chord_progressions']

  const chordProgressions: ChordProgression[] = []

  for (let chordProgResponse of response) {
    let structuredChordResponse = []
    for (let chordResponse of chordProgResponse) {
      structuredChordResponse.push(createChord(chordResponse.chord))
    }
    chordProgressions.push({ chords: structuredChordResponse })
  }

  return NextResponse.json({ chordProgressions: chordProgressions })

  // return NextResponse.json({
  //   chordProgressions: [
  //     {
  //       chords: [
  //         {
  //           representation: 'B#',
  //           key: 'B',
  //           suffix: 'major',
  //         },
  //         {
  //           representation: 'B#',
  //           key: 'B',
  //           suffix: 'major',
  //         },
  //         {
  //           representation: 'B#',
  //           key: 'B',
  //           suffix: 'major',
  //         },
  //         {
  //           representation: 'B#',
  //           key: 'B',
  //           suffix: 'major',
  //         },
  //       ],
  //     },
  //   ],
  // })
}

// chatgpt function should return an object like this
function createChord(representation: string): Chord {
  return {
    representation: representation,
    key: 'B',
    suffix: 'major',
  }
}
