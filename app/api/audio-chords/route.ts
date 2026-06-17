import OpenAI from 'openai'
import { z } from 'zod'
import {
  parseIdentifiedChords,
  parseIdentifiedChordsResponse,
} from '@/lib/audio-chord-analysis'

export const maxDuration = 30

const RequestSchema = z.object({
  audioUrl: z.string().min(1),
  audioDataUrl: z.string().min(1).optional(),
  prompt: z.string().optional(),
})

function parseAudioDataUrl(audioDataUrl: string) {
  const match = audioDataUrl.match(/^data:(audio\/[a-z0-9.+-]+);base64,(.+)$/i)
  if (!match) {
    throw new Error('Audio recording could not be read.')
  }

  const mimeType = match[1].toLowerCase()
  const format = mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3' : 'wav'

  return {
    data: match[2],
    format,
  }
}

async function loadAudioPayload(audioUrl: string) {
  if (audioUrl.startsWith('data:')) {
    return parseAudioDataUrl(audioUrl)
  }

  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error('Audio recording could not be read.')
    }

    const contentType = response.headers.get('content-type') ?? 'audio/wav'
    const format =
      contentType.includes('mpeg') || contentType.includes('mp3') ? 'mp3' : 'wav'
    const buffer = Buffer.from(await response.arrayBuffer())

    return {
      data: buffer.toString('base64'),
      format,
    }
  }

  throw new Error('Audio recording could not be read.')
}

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json())
    const audioUrl = body.audioUrl || body.audioDataUrl
    if (!audioUrl) {
      throw new Error('Audio recording could not be read.')
    }

    const audio = await loadAudioPayload(audioUrl)

    const openai = new OpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-audio-1.5',
      modalities: ['text'],
      messages: [
        {
          role: 'system',
          content:
            'You identify guitar chords from short recordings. Your entire response must be one JSON object and nothing else. Do not greet the user or add prose. Use this shape: {"chords":[{"name":"Em","confidence":0.85,"startSeconds":0,"endSeconds":1.5,"alternativeNames":["Em7"]}],"summary":"...","notes":"..."}. Use common chord symbols compatible with Tonal.js, such as Em, C, Cadd9, G, D/F#, Am7, Fmaj7. If the recording is unclear, return the best guesses with lower confidence and explain uncertainty in notes.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: body.prompt?.trim()
                ? `Identify the guitar chords in this recording. User request: ${body.prompt}`
                : 'Identify the guitar chords in this recording.',
            },
            {
              type: 'input_audio',
              input_audio: {
                data: audio.data,
                format: audio.format,
              },
            },
          ],
        } as any,
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return Response.json({ error: 'No chord analysis was returned.' }, { status: 502 })
    }

    const identified = await parseIdentifiedChordsResponse(content)
    const parsed = parseIdentifiedChords(identified)

    return Response.json({
      success: true,
      identified,
      progression: parsed.progression,
      summary: parsed.summary,
      notes: parsed.notes,
    })
  } catch (error: any) {
    console.error('Audio chord analysis error:', error)
    return Response.json(
      { success: false, error: error.message || 'Could not identify chords from this recording.' },
      { status: 500 },
    )
  }
}
