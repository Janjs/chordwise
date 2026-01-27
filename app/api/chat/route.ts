import { streamText, tool, convertToModelMessages, UIMessage, generateObject, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { z } from 'zod'
import { parseProgressions, ChordProgressionsSchema } from '@/lib/chord-generation'
import { createHash } from 'crypto'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export const maxDuration = 30

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function generateCacheKey(messages: UIMessage[], model: string): string {
  const keyData = JSON.stringify({ messages, model })
  return createHash('sha256').update(keyData).digest('hex')
}

async function getCachedResponse(key: string): Promise<{ response: string; headers: Record<string, string> } | null> {
  try {
    return await convex.query(api.cache.getPromptCache, { cacheKey: key })
  } catch (error) {
    console.error('Error getting prompt cache:', error)
    return null
  }
}

async function setCachedResponse(key: string, response: string, headers: Record<string, string>): Promise<void> {
  try {
    await convex.mutation(api.cache.setPromptCache, {
      cacheKey: key,
      response,
      headers,
    })
  } catch (error) {
    console.error('Error setting prompt cache:', error)
  }
}

async function collectStreamForCache(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const chunks: Uint8Array[] = []
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('terminated') || error.cause?.code === 'UND_ERR_SOCKET') {
      console.log('Stream terminated early, caching partial response')
    } else {
      throw error
    }
  } finally {
    try {
      reader.releaseLock()
    } catch (e) {
      // Ignore errors releasing lock
    }
  }
  
  if (chunks.length === 0) {
    throw new Error('No data collected from stream')
  }
  
  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }
  
  return decoder.decode(combined)
}

const generateChordProgressionsTool = tool({
  description: 'Generate chord progressions based on a description. The description can include mood, genre, key, or style. Returns an array of chord progressions.',
  inputSchema: z.object({
    description: z.string().describe('The description or style of chord progressions to generate (e.g., "happy jazz progressions in C major")'),
  }),
  execute: async ({ description }) => {
    const prompt = `Generate chord progressions that fit the following description: ${description}`
    const fullPrompt = `Generate 5 chord progressions based on the user's request. Each progression should be an array of chord names (e.g., "Am", "Dm7", "G7", "Cmaj7").\n\nUser request: ${prompt}`
    
    const toolCacheKey = createHash('sha256').update(fullPrompt).digest('hex')
    
    try {
      const cached = await convex.query(api.cache.getToolCache, { cacheKey: toolCacheKey })
      
      if (cached) {
        console.log('Tool cache HIT for description:', description)
        const progressions = parseProgressions(cached)
        return {
          success: true,
          progressions,
          message: `Generated ${progressions.length} chord progressions.`,
        }
      }
    } catch (error) {
      console.error('Error getting tool cache:', error)
    }

    try {
      const { object } = await generateObject({
        model: openaiProvider('gpt-4o-mini'),
        schema: ChordProgressionsSchema,
        prompt: fullPrompt,
      })

      if (!object || !object.chord_progressions) {
        return { error: 'Error while generating chord progressions.' }
      }

      try {
        await convex.mutation(api.cache.setToolCache, {
          cacheKey: toolCacheKey,
          result: object,
        })
        console.log('Tool cache MISS - cached result for description:', description)
      } catch (error) {
        console.error('Error setting tool cache:', error)
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

    const cacheKey = generateCacheKey(messages, model)
    const cached = await getCachedResponse(cacheKey)
    
    if (cached) {
      console.log('Cache HIT for prompt request:', { cacheKey, model, messageCount: messages.length })
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cached.response))
          controller.close()
        },
      })
      
      return new Response(stream, {
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
        },
      })
    }

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

    const streamResponse = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    })

    const stream = streamResponse.body
    if (!stream) {
      return streamResponse
    }

    const responseHeaders: Record<string, string> = {}
    streamResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const [userStream, cacheStream] = stream.tee()

    collectStreamForCache(cacheStream)
      .then(async (collectedResponse) => {
        if (collectedResponse && collectedResponse.length > 0) {
          await setCachedResponse(cacheKey, collectedResponse, responseHeaders)
          console.log('Cached prompt request:', { cacheKey, model, messageCount: messages.length })
        }
      })
      .catch((error) => {
        if (error.message !== 'No data collected from stream') {
          console.error('Error caching response:', error.message || error)
        }
      })

    return new Response(userStream, {
      headers: {
        ...streamResponse.headers,
        'X-Cache': 'MISS',
      },
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
