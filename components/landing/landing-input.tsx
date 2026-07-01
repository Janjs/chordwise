'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { MicIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  usePromptInputController,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import {
  AudioAttachmentPreview,
  AudioRecorderButton,
  AudioRecordingStatusProvider,
  type AudioRecorderButtonHandle,
} from '@/components/generate-new/audio-recorder-button'
import { useAudioRecordingStatus } from '@/components/generate-new/audio-recording-status'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { uploadAudioSourceToConvex } from '@/lib/upload-recording'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { api } from '@/convex/_generated/api'

const PROMPT_SUGGESTION = 'Happy jazz progressions in C major'
const CHORD_IDENTIFICATION_PROMPT = 'What chords am I playing?'
const PLACEHOLDER = 'e.g., happy jazz progressions in C major'

function LandingInputContent() {
  const router = useRouter()
  const recorderRef = useRef<AudioRecorderButtonHandle>(null)
  const anonymousSessionId = useAnonymousSession()
  const generateUploadUrl = useMutation(api.recordings.generateUploadUrl)
  const createPendingRecording = useMutation(api.recordings.createPendingRecording)
  const [isUploading, setIsUploading] = useState(false)

  const { textInput, attachments } = usePromptInputController()
  const { setFileUploading } = useAudioRecordingStatus()

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim())
    const audioFiles = message.files.filter((file) => file.mediaType?.startsWith('audio/') && file.url)
    const attachmentAudioFiles = attachments.files.filter((file) => file.mediaType?.startsWith('audio/'))
    const hasAudio = audioFiles.length > 0

    if (!hasText && !hasAudio) return

    const textToSend = message.text?.trim() || (hasAudio ? CHORD_IDENTIFICATION_PROMPT : PLACEHOLDER)

    if (hasAudio) {
      if (!anonymousSessionId) {
        toast.error('Session not initialized. Please refresh the page.')
        return
      }

      setIsUploading(true)
      for (const file of attachmentAudioFiles) {
        setFileUploading(file.id, true)
      }
      try {
        const uploadedRecordings = await Promise.all(
          audioFiles.map((file, index) =>
            uploadAudioSourceToConvex({
              audioUrl: file.url,
              sessionId: anonymousSessionId,
              prompt: textToSend,
              filename: file.filename ?? `recording-${index + 1}.wav`,
              generateUploadUrl: () => generateUploadUrl(),
              createPendingRecording: (args) => createPendingRecording(args),
            }),
          ),
        )

        const recordingIds = uploadedRecordings.map((recording) => recording.id).join(',')
        router.push(
          `/generate?prompt=${encodeURIComponent(textToSend)}&recordings=${encodeURIComponent(recordingIds)}`,
        )
      } catch {
        toast.error('Recording could not be uploaded.')
      } finally {
        for (const file of attachmentAudioFiles) {
          setFileUploading(file.id, false)
        }
        setIsUploading(false)
      }
      return
    }

    router.push(`/generate?prompt=${encodeURIComponent(textToSend)}`)
  }

  const handlePromptSuggestion = () => {
    textInput.setInput(PROMPT_SUGGESTION)
  }

  const handleChordIdentificationSuggestion = () => {
    textInput.setInput(CHORD_IDENTIFICATION_PROMPT)
    recorderRef.current?.startRecording()
  }

  const hasText = Boolean(textInput.value?.trim())
  const hasAudio = attachments.files.some((file) => file.mediaType?.startsWith('audio/'))
  const isBusy = isUploading

  return (
    <div className="flex flex-col w-full max-w-xl items-center">
      <PromptInput
        accept="audio/*"
        maxFiles={5}
        maxFileSize={10 * 1024 * 1024}
        clearOnSubmit={false}
        onSubmit={handleSubmit}
        className="w-full"
      >
        <AudioAttachmentPreview variant="header" />
        <PromptInputBody>
          <PromptInputTextarea
            className={cn(hasAudio && 'pt-1.5')}
            placeholder={PLACEHOLDER}
          />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full items-end justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
            <AudioRecorderButton ref={recorderRef} />
          </div>
          <PromptInputSubmit disabled={isBusy || (!hasText && !hasAudio)} />
        </PromptInputFooter>
      </PromptInput>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge
          variant="outline"
          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-primary/10"
          onClick={handlePromptSuggestion}
        >
          <SparklesIcon className="size-3.5" />
          {PROMPT_SUGGESTION}
        </Badge>
        <Badge
          variant="outline"
          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-primary/10"
          onClick={handleChordIdentificationSuggestion}
        >
          <MicIcon className="size-3.5" />
          {CHORD_IDENTIFICATION_PROMPT}
        </Badge>
      </div>
    </div>
  )
}

export default function LandingInput() {
  return (
    <PromptInputProvider>
      <AudioRecordingStatusProvider>
        <LandingInputContent />
      </AudioRecordingStatusProvider>
    </PromptInputProvider>
  )
}
