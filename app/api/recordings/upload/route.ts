import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import {
  getResponseErrorText,
  getStorageUploadFailureMessage,
} from '@/lib/recording-upload-errors'

export const maxDuration = 30

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function readHeader(req: Request, name: string) {
  const value = req.headers.get(name)?.trim()
  return value || undefined
}

function readEncodedHeader(req: Request, name: string) {
  const value = readHeader(req, name)
  return value ? decodeURIComponent(value) : undefined
}

export async function POST(req: Request) {
  try {
    const sessionId = readHeader(req, 'x-chordwise-session-id')
    if (!sessionId) {
      return Response.json({ error: 'Session not initialized.' }, { status: 400 })
    }

    const filename = readEncodedHeader(req, 'x-chordwise-filename') ?? 'recording.wav'
    const prompt = readEncodedHeader(req, 'x-chordwise-prompt')
    const contentType = req.headers.get('content-type') ?? 'audio/wav'
    const blob = await req.blob()

    if (blob.size === 0) {
      return Response.json({ error: 'Recording is empty.' }, { status: 400 })
    }

    const uploadUrl = await convex.mutation(api.recordings.generateUploadUrl)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: blob,
    })

    if (!uploadResponse.ok) {
      const upstreamError = await getResponseErrorText(uploadResponse)
      const error = getStorageUploadFailureMessage(
        uploadResponse.status,
        uploadResponse.statusText,
        upstreamError,
      )
      console.error('Convex storage upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        upstreamError,
        contentType,
        size: blob.size,
        uploadOrigin: new URL(uploadUrl).origin,
      })
      return Response.json({ error }, { status: 502 })
    }

    const { storageId } = await uploadResponse.json()
    const recording = await convex.mutation(api.recordings.createPendingRecording, {
      sessionId,
      storageId,
      prompt,
      filename,
    })

    return Response.json(recording)
  } catch (error: any) {
    console.error('Recording upload error:', error)
    return Response.json(
      { error: error.message || 'Recording upload failed.' },
      { status: 500 },
    )
  }
}
