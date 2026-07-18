import type { Id } from '@/convex/_generated/dataModel'
export { AUDIO_UPLOAD_MAX_BYTES } from './audio-recording-limits'

export type UploadedRecording = {
  id: Id<'pendingRecordings'>
  url: string
  storageId: Id<'_storage'>
}

export async function blobFromAudioSource(sourceUrl: string) {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error('Could not read recording.')
  }

  return response.blob()
}

export async function uploadAudioSourceToConvex({
  audioUrl,
  sessionId,
  prompt,
  filename = 'recording.wav',
}: {
  audioUrl: string
  sessionId: string
  prompt?: string
  filename?: string
}): Promise<UploadedRecording> {
  const blob = await blobFromAudioSource(audioUrl)
  const file = new File([blob], filename, { type: blob.type || 'audio/wav' })
  const uploadResponse = await fetch('/api/recordings/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      'x-chordwise-session-id': sessionId,
      'x-chordwise-filename': encodeURIComponent(file.name),
      ...(prompt ? { 'x-chordwise-prompt': encodeURIComponent(prompt) } : {}),
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    if (uploadResponse.status === 413) {
      throw new Error('Recording is too large. Try a shorter recording.')
    }

    let message = 'Recording upload failed.'
    try {
      const result = await uploadResponse.json()
      if (typeof result?.error === 'string') {
        message = result.error
      }
    } catch {
      // Keep the generic upload failure when the platform returns a non-JSON error page.
    }

    throw new Error(message)
  }

  return uploadResponse.json()
}

export function getRecordingIdsFromSearchParams(searchParams: URLSearchParams) {
  return searchParams.get('recordings')?.split(',').filter(Boolean) ?? []
}

export function isPlayableAudioUrl(url: string) {
  if (!url) return false
  if (url.startsWith('data:audio/')) return true
  if (url.startsWith('blob:')) return true
  if (url.includes('/convex/') || url.includes('.convex.site') || url.includes('.convex.cloud')) {
    return true
  }

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (parsed.pathname.includes('/generate')) return false
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
