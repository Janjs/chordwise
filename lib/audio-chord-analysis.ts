import { z } from 'zod'
import { generateObject } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import type { Progression } from '../types/types'
import { getProgressionMidis } from './chord-generation'

export const IdentifiedChordSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  startSeconds: z.number().min(0).optional(),
  endSeconds: z.number().min(0).optional(),
  alternativeNames: z.array(z.string()).optional(),
})

export const IdentifiedChordsSchema = z.object({
  chords: z.array(IdentifiedChordSchema),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

const IdentifiedChordsStructuredSchema = z.object({
  chords: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  summary: z.string(),
  notes: z.string(),
})

export type IdentifiedChords = z.infer<typeof IdentifiedChordsSchema>

export function extractJsonObjectFromText(content: string): unknown {
  const trimmed = content.trim()

  const attempts = [
    trimmed,
    trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)?.[1]?.trim(),
    trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1]?.trim(),
  ].filter(Boolean) as string[]

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch {
      // try next candidate
    }
  }

  const start = trimmed.indexOf('{')
  if (start !== -1) {
    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < trimmed.length; i++) {
      const char = trimmed[i]

      if (inString) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === '"') inString = false
        continue
      }

      if (char === '"') inString = true
      else if (char === '{') depth++
      else if (char === '}') {
        depth--
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1))
          } catch {
            break
          }
        }
      }
    }
  }

  throw new Error('Could not parse chord analysis response.')
}

export async function parseIdentifiedChordsResponse(content: string): Promise<IdentifiedChords> {
  try {
    return IdentifiedChordsSchema.parse(extractJsonObjectFromText(content))
  } catch {
    const { object } = await generateObject({
      model: openaiProvider('gpt-4o-mini'),
      schema: IdentifiedChordsStructuredSchema,
      prompt: `Convert this guitar chord analysis into structured JSON. Use Tonal.js-compatible chord symbols. If no chords were identified, return an empty chords array and explain why in notes.\n\nAnalysis:\n${content}`,
    })
    return IdentifiedChordsSchema.parse(object)
  }
}

export function parseIdentifiedChords(data: IdentifiedChords): {
  progression: Progression
  summary?: string
  notes?: string
} {
  const chords = data.chords
    .map((chord) => chord.name.trim())
    .filter(Boolean)
    .map((representation) => ({
      representation,
      midi: getProgressionMidis(representation),
    }))

  return {
    progression: { chords },
    summary: data.summary,
    notes: data.notes,
  }
}
