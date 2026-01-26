import { streamText, tool, convertToModelMessages, UIMessage } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { z } from 'zod'
import { parseProgressions, ChordProgressionsSchema } from '@/lib/chord-generation'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

const openai = new OpenAI()

export const maxDuration = 30

const generateChordProgressionsTool = tool({
  description: 'Generate chord progressions based on a description, mood, genre, and key. Returns an array of chord progressions.',
  parameters: z.object({
    description: z.string().describe('The description or style of chord progressions to generate'),
    musicalKey: z.string().optional().describe('The musical key (e.g., "C", "A", "F#"). If not specified, the AI will choose an appropriate key.'),
    musicalScale: z.enum(['major', 'minor']).optional().default('major').describe('The musical scale (major or minor)'),
  }),
  execute: async ({ description, musicalKey, musicalScale = 'major' }) => {
    const prompt = musicalKey && musicalKey !== 'Key'
      ? `Generate chord progressions in the key of ${musicalKey} ${musicalScale}, that fit the following description: ${description}`
      : `Generate chord progressions that fit the following description: ${description}`

    try {
      const response = await openai.responses.parse({
        model: 'gpt-4o-mini',
        instructions: `Generate 5 chord progressions based on the user's request. Each progression should be an array of chord names (e.g., "Am", "Dm7", "G7", "Cmaj7").`,
        input: prompt,
        text: {
          format: zodTextFormat(ChordProgressionsSchema, 'chord_progressions'),
        },
      })

      const parsed = response.output_parsed

      if (!parsed || !parsed.chord_progressions) {
        return { error: 'Error while generating chord progressions.' }
      }

      const progressions = parseProgressions(parsed)

      return {
        success: true,
        progressions,
        message: `Generated ${progressions.length} chord progressions.`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error while generating chord progressions.',
      }
    }
  },
})

export async function POST(req: Request) {
  const {
    messages,
    model = 'gpt-4o-mini',
  }: {
    messages: UIMessage[]
    model?: string
  } = await req.json()

  const result = streamText({
    model: openaiProvider(model),
    messages: await convertToModelMessages(messages),
    system: `You are a helpful assistant that generates chord progressions based on user requests. 
When users ask for chord progressions, use the generateChordProgressions tool to create them.
Extract the musical key and scale from the user's message if mentioned (e.g., "in A major", "C minor").
If no key is specified, you can omit the musicalKey parameter and let the tool choose an appropriate key.
After generating progressions, explain what was created and highlight interesting aspects of the progressions.`,
    tools: {
      generateChordProgressions: generateChordProgressionsTool,
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  })
}
