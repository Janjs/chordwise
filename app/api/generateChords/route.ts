import openai from './openai'
import { Chord, ChordProgression } from '@/types/types'
import { NextResponse } from 'next/server'

export interface GenerateChordsRequest {
  description: string
  musicalKey: string
  musicalScale: string
}

export async function POST(req: Request) {
  const userInput: GenerateChordsRequest = await req.json()

  const content = `True.
  1. A - Bm - D - C
  2. Fm - G7 - Cm - Ab
  3. Cm - Bb - Ab - G7
  4. Dm - G7 - Cm - Ab
  5. Cm - G7 - Fm - Ab`

  const A = createChord('A', 'A', 'major')
  const Bm = createChord('Bm', 'B', 'minor')
  const D = createChord('D', 'D', 'major')
  const C = createChord('C', 'A', 'major')

  const chordProgressions: ChordProgression[] = [
    { chords: [A, Bm, D, C] },
    { chords: [D, Bm, A, C] },
    { chords: [Bm, A, D, D] },
    { chords: [D, C, A, Bm] },
  ]

  // const completion = await openai.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   temperature: 0.8,
  //   n: 1,
  //   stream: false,
  //   messages: [
  //     {
  //       role: "system",
  //       content: `You are a generator of chord progressions.
  //         The user will ask you to generate a numbered list of 5 chord progressions in a certain key and that fit a certain description.
  //         You will respond with a boolean (true or false) if you were able to complete the request, followed by the numbered list.`,
  //     },
  //     {
  //       role: "user",
  //       content: `Generate 5 chord progressions in the key of ${userInput.musicalKey} ${userInput.musicalScale} that fit the following description: ${userInput.description}}`,
  //     },
  //   ],
  // });
  // const response = completion.data.choices[0].message?.content

  return NextResponse.json({ chordProgressions: chordProgressions })
}

// chatgpt function should return an object like this
function createChord(representation: string, key: string, suffic: string): Chord {
  return {
    representation: representation,
    key: key,
    suffix: suffic,
  }
}
// # with chat complition
// function parseChords(chordsString: string): ChordProgression[] {
//   return chordsString
//     .split('\n')
//     .map((item, i) => {
//       if (i === 0) return { chords: [] }
//       const elements = item.split('-').map((e) => e.trim().replace(/^\d+\.\s*/, ''))
//       return { chords: elements }
//     })
//     .filter((chordProgression) => chordProgression.chords.length > 0)
// }

// function validateFoundChords(response: string | undefined) {
//   if (response?.startsWith('True')) return true
//   else false
// }
