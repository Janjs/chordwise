import { streamText, tool, convertToModelMessages, UIMessage, generateObject, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { z } from 'zod'
import { parseProgressions, ChordProgressionsSchema } from '@/lib/chord-generation'

export const maxDuration = 30

const generateChordProgressionsTool = tool({
  description: 'Generate chord progressions based on a description. The description can include mood, genre, key, or style. Returns an array of chord progressions.',
  inputSchema: z.object({
    description: z.string().describe('The description or style of chord progressions to generate (e.g., "happy jazz progressions in C major")'),
  }),
  execute: async ({ description }) => {
    const prompt = `Generate chord progressions that fit the following description: ${description}`

    try {
      const { object } = await generateObject({
        model: openaiProvider('gpt-4o-mini'),
        schema: ChordProgressionsSchema,
        prompt: `Generate 5 chord progressions based on the user's request. Each progression should be an array of chord names (e.g., "Am", "Dm7", "G7", "Cmaj7").\n\nUser request: ${prompt}`,
      })

      if (!object || !object.chord_progressions) {
        return { error: 'Error while generating chord progressions.' }
      }

      const progressions = parseProgressions(object)

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
  try {
    const {
      messages,
      model = 'gpt-4o',
    }: {
      messages: UIMessage[]
      model?: string
    } = await req.json()

    const result = streamText({
      model: openaiProvider(model),
      messages: await convertToModelMessages(messages),
      system: `You are a helpful assistant that generates chord progressions based on user requests. 
When users ask for chord progressions, you should:
1. First, provide a brief response acknowledging their request and explaining what you're about to do.
2. Then use the generateChordProgressions tool to create the progressions. The description should include any relevant details like mood, genre, key, or style mentioned by the user.
3. After the tool completes, provide a detailed explanation of what was created, highlight interesting aspects of the progressions, and offer any musical insights about the chord progressions.

Always include text before and after calling the tool to create a natural conversation flow.`,
      tools: {
        generateChordProgressions: generateChordProgressionsTool,
      },
      maxSteps: 5,
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: 'word',
      }),
    })

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your request.',
        details: error.cause || undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
