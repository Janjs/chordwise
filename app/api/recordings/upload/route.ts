import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import {
  describeUploadUrl,
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

function createUploadRequestId() {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(req: Request) {
  const requestId = createUploadRequestId()

  try {
    console.info('Recording upload request started:', {
      requestId,
      method: req.method,
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    })

    const sessionId = readHeader(req, 'x-chordwise-session-id')
    if (!sessionId) {
      console.warn('Recording upload rejected before body read:', {
        requestId,
        reason: 'missing_session',
      })
      return Response.json({ error: 'Session not initialized.' }, { status: 400 })
    }

    const filename = readEncodedHeader(req, 'x-chordwise-filename') ?? 'recording.wav'
    const prompt = readEncodedHeader(req, 'x-chordwise-prompt')
    const contentType = req.headers.get('content-type') ?? 'audio/wav'
    console.info('Recording upload reading body:', {
      requestId,
      contentType,
      filename,
      hasPrompt: Boolean(prompt),
      sessionIdSuffix: sessionId.slice(-8),
    })

    const blob = await req.blob()
    console.info('Recording upload body read:', {
      requestId,
      contentType,
      filename,
      size: blob.size,
    })

    if (blob.size === 0) {
      console.warn('Recording upload rejected after body read:', {
        requestId,
        reason: 'empty_body',
        contentType,
        filename,
      })
      return Response.json({ error: 'Recording is empty.' }, { status: 400 })
    }

    console.info('Recording upload requesting Convex storage URL:', {
      requestId,
      contentType,
      size: blob.size,
    })
    const uploadUrl = await convex.mutation(api.recordings.generateUploadUrl)
    const uploadTarget = describeUploadUrl(uploadUrl)
    console.info('Recording upload received Convex storage URL:', {
      requestId,
      uploadTarget,
    })

    console.info('Recording upload posting to Convex storage:', {
      requestId,
      uploadTarget,
      contentType,
      size: blob.size,
    })
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: blob,
    })
    console.info('Recording upload Convex storage response received:', {
      requestId,
      uploadTarget,
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
    })

    if (!uploadResponse.ok) {
      const upstreamError = await getResponseErrorText(uploadResponse)
      const error = getStorageUploadFailureMessage(
        uploadResponse.status,
        uploadResponse.statusText,
        upstreamError,
      )
      console.error('Convex storage upload failed:', {
        requestId,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        upstreamError,
        contentType,
        size: blob.size,
        uploadTarget,
      })
      return Response.json({ error }, { status: 502 })
    }

    const { storageId } = await uploadResponse.json()
    console.info('Recording upload storage created:', {
      requestId,
      storageId,
    })

    console.info('Recording upload creating pending recording:', {
      requestId,
      storageId,
      filename,
      sessionIdSuffix: sessionId.slice(-8),
    })
    const recording = await convex.mutation(api.recordings.createPendingRecording, {
      sessionId,
      storageId,
      prompt,
      filename,
    })

    console.info('Recording upload completed:', {
      requestId,
      recordingId: recording.id,
      storageId: recording.storageId,
      hasUrl: Boolean(recording.url),
    })
    return Response.json(recording)
  } catch (error: any) {
    console.error('Recording upload error:', {
      requestId,
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    })
    return Response.json(
      { error: error.message || 'Recording upload failed.' },
      { status: 500 },
    )
  }
}
