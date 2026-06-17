import type { Id } from '@/convex/_generated/dataModel'

type GenerateUploadUrl = () => Promise<string>
type CreatePendingRecording = (args: {
  sessionId: string
  storageId: Id<'_storage'>
  prompt?: string
  filename?: string
}) => Promise<{
  id: Id<'pendingRecordings'>
  url: string
  storageId: Id<'_storage'>
}>

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
  generateUploadUrl,
  createPendingRecording,
}: {
  audioUrl: string
  sessionId: string
  prompt?: string
  filename?: string
  generateUploadUrl: GenerateUploadUrl
  createPendingRecording: CreatePendingRecording
}): Promise<UploadedRecording> {
  const blob = await blobFromAudioSource(audioUrl)
  const file = new File([blob], filename, { type: blob.type || 'audio/wav' })
  const uploadUrl = await generateUploadUrl()
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error('Recording upload failed.')
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> }

  return createPendingRecording({
    sessionId,
    storageId,
    prompt,
    filename: file.name,
  })
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
