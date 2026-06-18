'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { Progression } from '@/types/types'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { cn } from '@/lib/utils'
import {
  getRecordingIdsFromSearchParams,
  isPlayableAudioUrl,
  uploadAudioSourceToConvex,
  type UploadedRecording,
} from '@/lib/upload-recording'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
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
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XIcon } from 'lucide-react'
import { MascotCursor } from '@/components/mascot-cursor'
import { AudioAttachmentPreview, AudioRecorderButton, AudioRecordingStatusProvider, MessageAudioRecordings, type MessageAudioItem } from './audio-recorder-button'
import { useAudioRecordingStatus } from './audio-recording-status'
import { ChatToolCallCard } from './chat-tool-call-card'

const CHORD_IDENTIFICATION_PROMPT = 'What chords am I playing?'
const PROMPT_PLACEHOLDER = 'e.g., happy jazz progressions in C major'

type StoredRecording = {
  url: string
  storageId?: Id<'_storage'>
}

function getMessageText(message: {
  parts?: Array<{ type: string; text?: string }>
  content?: unknown
}) {
  const textPart = message.parts?.find(
    (part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part,
  )
  return textPart?.text ?? (message.content ? String(message.content) : '')
}

function withAudioPartsForSave<T extends {
  id: string | number
  role: string
  content?: string
  parts?: Array<{ type: string; text?: string }>
}>(
  messages: T[],
  audioById: Map<string, StoredRecording[]>,
): T[] {
  return messages.map((message) => {
    const recordings = audioById.get(String(message.id))
    if (!recordings?.length) return message

    const hasAudio = message.parts?.some(
      (part) => part.type === 'file' || part.type === 'data-audio-recording',
    )
    if (hasAudio) return message

    const textParts =
      message.parts?.filter(
        (part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part,
      ) ?? []
    const resolvedTextParts =
      textParts.length > 0
        ? textParts
        : message.content
          ? [{ type: 'text' as const, text: message.content }]
          : []

    return {
      ...message,
      parts: [...createAudioRecordingParts(recordings), ...resolvedTextParts],
    }
  })
}

function createAudioRecordingParts(recordings: StoredRecording[]) {
  return recordings.map((recording, index) => ({
    type: 'data-audio-recording' as const,
    data: {
      url: recording.url,
      storageId: recording.storageId,
      filename: `recording-${index + 1}.wav`,
    },
  }))
}

function getStorageIdFromPart(part: { providerMetadata?: unknown }) {
  const metadata = part.providerMetadata as { convexStorageId?: Id<'_storage'> } | undefined
  return metadata?.convexStorageId
}

function getAudioItemsFromParts(
  parts: Array<{ type: string; url?: string; mediaType?: string; providerMetadata?: unknown; data?: unknown }>,
) {
  const items: MessageAudioItem[] = []

  for (const part of parts) {
    if (part.type === 'file') {
      items.push({
        url: typeof part.url === 'string' && isPlayableAudioUrl(part.url) ? part.url : undefined,
        storageId: getStorageIdFromPart(part),
      })
      continue
    }

    if (part.type === 'data-audio-recording' && part.data && typeof part.data === 'object') {
      const data = part.data as { url?: string; storageId?: Id<'_storage'> }
      items.push({
        url: typeof data.url === 'string' && isPlayableAudioUrl(data.url) ? data.url : undefined,
        storageId: data.storageId,
      })
    }
  }

  return items.filter((item) => item.storageId || item.url)
}

function getAudioItemsFromMessage(
  message: {
    id?: string
    parts?: Array<{ type: string; url?: string; mediaType?: string; providerMetadata?: unknown }>
  },
  messageAudioById: Map<string, StoredRecording[]>,
) {
  const fromParts = getAudioItemsFromParts(message.parts ?? [])
  const fromRef = message.id ? messageAudioById.get(String(message.id)) ?? [] : []
  const merged = [...fromParts]

  for (const recording of fromRef) {
    const alreadyIncluded = merged.some(
      (item) =>
        (recording.storageId && item.storageId === recording.storageId) ||
        (recording.url && item.url === recording.url),
    )
    if (!alreadyIncluded) {
      merged.push({ url: recording.url, storageId: recording.storageId })
    }
  }

  return merged
}

function isProgressionToolPart(part: { type?: string; toolName?: string }) {
  if (part.type === 'tool-call' && part.toolName === 'generateChordProgressions') {
    return true
  }

  return typeof part.type === 'string' && part.type === 'tool-generateChordProgressions'
}

function messageHasProgressionTool(
  message: { role?: string; parts?: Array<{ type?: string; toolName?: string }> },
) {
  return (
    message.role === 'assistant' &&
    message.parts?.some((part) => isProgressionToolPart(part)) === true
  )
}

const extractProgressionsFromMessages = (messages: any[]): Progression[] => {
  const progressions: Progression[] = []
  for (const m of messages) {
    if (m.role === 'assistant' && m.parts) {
      for (const part of m.parts) {
        if (
          (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
          'state' in part &&
          part.state === 'output-available' &&
          'output' in part &&
          part.output
        ) {
          const toolName = 'toolName' in part ? part.toolName : typeof part.type === 'string' ? part.type.split('-').slice(1).join('-') : ''
          if (toolName === 'generateChordProgressions') {
            const result = part.output as { success: boolean; progressions?: Progression[]; error?: string }
            if (result.success && result.progressions) {
              progressions.push(...result.progressions)
            }
          }
        }
      }
    }
  }
  return progressions
}


function ConversationWithFade({ children, className, onViewportReady }: { children: React.ReactNode; className?: string; onViewportReady?: (viewport: HTMLElement | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const viewportRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const onViewportReadyRef = useRef(onViewportReady)
  onViewportReadyRef.current = onViewportReady

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const findScrollableElement = (): HTMLElement | null => {
      const elements = Array.from(container.querySelectorAll('*'))
      for (const el of elements) {
        const htmlEl = el as HTMLElement
        const style = getComputedStyle(htmlEl)
        if (htmlEl.scrollHeight > htmlEl.clientHeight + 1 &&
          (style.overflowY === 'auto' || style.overflowY === 'scroll')) {
          return htmlEl
        }
      }
      return null
    }

    const checkScroll = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      const { scrollTop, scrollHeight, clientHeight } = viewport
      setShowTopFade(scrollTop > 0)
      setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1)
    }

    const attachListeners = () => {
      const viewport = findScrollableElement()
      if (!viewport) {
        timeoutId = setTimeout(attachListeners, 50)
        return
      }

      viewportRef.current = viewport
      onViewportReadyRef.current?.(viewport)
      checkScroll()
      viewport.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)

      observerRef.current = new MutationObserver(checkScroll)
      observerRef.current.observe(viewport, { childList: true, subtree: true })
    }

    attachListeners()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (viewportRef.current) {
        viewportRef.current.removeEventListener('scroll', checkScroll)
      }
      window.removeEventListener('resize', checkScroll)
      observerRef.current?.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative flex flex-col min-h-0 ${className || ''}`}>
      {showTopFade && (
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      )}
      {showBottomFade && (
        <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      )}
      {children}
    </div>
  )
}


interface ChatbotProps {
  prompt?: string
  chatId?: string
  onProgressionsGenerated?: (progressions: Progression[], shouldReplace?: boolean) => void
  onChatCreated?: (chatId: string) => void
  resetKey?: string | null
  onToolClick?: (toolName: string, output: any) => void
}

function ChatbotContent({ prompt: externalPrompt, chatId, onProgressionsGenerated, onChatCreated, resetKey, onToolClick }: ChatbotProps) {
  const [error, setError] = useState<string | null>(null)
  const lastHandledToolMessageIdRef = useRef<string | null>(null)
  const currentChatIdRef = useRef<string | null>(chatId || null)
  const lastSavedMessagesLengthRef = useRef<number>(0)
  const lastSubmittedPromptRef = useRef<string | null>(null)
  const audioProgressionsRef = useRef<Progression[]>([])
  const pendingAudioHandledRef = useRef(false)
  const pendingRecordingsRef = useRef<StoredRecording[]>([])
  const [messageAudioById, setMessageAudioById] = useState<Map<string, StoredRecording[]>>(new Map())
  const messageAudioByIdRef = useRef(messageAudioById)
  messageAudioByIdRef.current = messageAudioById
  const [pendingUserMessage, setPendingUserMessage] = useState<{
    text: string
    recordings: StoredRecording[]
  } | null>(null)

  const [isTyping, setIsTyping] = useState(false)
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false)
  const [audioToolPhase, setAudioToolPhase] = useState<'idle' | 'analyzing' | 'completed'>('idle')

  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const useCredit = useMutation(api.credits.useCredit)
  const createChat = useMutation(api.chats.create)
  const updateChat = useMutation(api.chats.update)
  const generateUploadUrl = useMutation(api.recordings.generateUploadUrl)
  const createPendingRecording = useMutation(api.recordings.createPendingRecording)
  const consumePendingRecordings = useMutation(api.recordings.consumePendingRecordings)
  const recordingIds = getRecordingIdsFromSearchParams(searchParams) as Id<'pendingRecordings'>[]
  const pendingRecordings = useQuery(
    api.recordings.getPendingRecordings,
    recordingIds.length > 0 && anonymousSessionId
      ? { ids: recordingIds, sessionId: anonymousSessionId }
      : 'skip',
  )
  const existingChat = useQuery(
    api.chats.get,
    chatId && isAuthenticated ? { id: chatId as Id<'chats'> } : 'skip'
  )

  const handleSignIn = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  const { textInput, attachments } = usePromptInputController()
  const { setFileUploading } = useAudioRecordingStatus()
  const [, setPrompt] = useGenerateSearchParams()

  const { messages, sendMessage, status, setMessages } = useChat({
    api: '/api/chat',
    onFinish: async (message: any) => {
      // Create a new chat if we don't have one, only for authenticated users
      if (isAuthenticated && !chatId && !currentChatIdRef.current) {
        try {
          // Use the prompt from URL params if available (set by handleSubmit), or try to find it in messages
          const promptParam = searchParams.get('prompt')

          // Note: messages in this closure might be stale (from start of request). 
          // We should construct the messages array carefully.
          // formatting the assistant message for storage
          const assistantMessage = {
            id: message.id || crypto.randomUUID(),
            role: 'assistant' as const,
            content: message.content || '',
            parts: message.parts,
            createdAt: Date.now()
          }

          // Try to get user message
          let userMessageContent = promptParam
          if (!userMessageContent && lastSubmittedPromptRef.current) {
            userMessageContent = lastSubmittedPromptRef.current
          }

          // Construct messages array for saving
          // If we have messages in state, use them (filtering out the partial assistant message if present)
          let messagesToSave: any[] = []

          if (messages.length > 0) {
            messagesToSave = withAudioPartsForSave(
              messages.map(m => ({
                id: m.id,
                role: m.role,
                content: 'content' in m ? String(m.content || '') : '',
                parts: 'parts' in m ? m.parts : undefined,
                createdAt: (m as any).createdAt instanceof Date ? (m as any).createdAt.getTime() : Date.now()
              })),
              messageAudioByIdRef.current,
            )
            // Check if the last message in state is the same as the finished message
            const lastStateMsg = messagesToSave[messagesToSave.length - 1]
            if (lastStateMsg.id === assistantMessage.id) {
              messagesToSave[messagesToSave.length - 1] = assistantMessage
            } else {
              messagesToSave.push(assistantMessage)
            }
          } else {
            // Fallback if messages state is empty
            messagesToSave = [
              {
                id: crypto.randomUUID(),
                role: 'user',
                content: userMessageContent || 'New Chat',
                parts: [{ type: 'text', text: userMessageContent || 'New Chat' }],
                createdAt: Date.now() - 1000
              },
              assistantMessage
            ]
          }

          const title = userMessageContent ? userMessageContent.slice(0, 50) : 'New Chat'

          const progressions = [
            ...extractProgressionsFromMessages(messagesToSave),
            ...audioProgressionsRef.current,
          ]

          // Create chat mutation
          const newChatId = await createChat({
            title: title || 'New Chat',
            messages: messagesToSave,
            progressions: progressions,
          })

          // 1. Create Chat -> get ID.
          currentChatIdRef.current = newChatId
          // 2. Redirect - preserve prompt if it exists
          const redirectUrl = promptParam
            ? `/generate?chatId=${newChatId}&prompt=${encodeURIComponent(promptParam)}`
            : `/generate?chatId=${newChatId}`
          router.push(redirectUrl)
        } catch (e) {
          console.error("Failed to create chat", e)
        }
      }
    },
    onError: (error: Error) => {
      console.error('Chat error:', error)
      setError(error.message || 'An error occurred. Please try again.')
    },
  } as any)

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.parts) {
      return
    }

    if (lastMessage.id === lastHandledToolMessageIdRef.current) {
      return
    }

    for (const part of lastMessage.parts) {
      if (
        (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
        'state' in part &&
        part.state === 'output-available' &&
        'output' in part &&
        part.output
      ) {
        const toolName =
          'toolName' in part ? part.toolName : typeof part.type === 'string' ? part.type.split('-').slice(1).join('-') : ''
        if (toolName === 'generateChordProgressions') {
          const result = part.output as { success: boolean; progressions?: Progression[]; error?: string }
          if (result.success && result.progressions && onProgressionsGenerated) {
            onProgressionsGenerated(result.progressions)
            lastHandledToolMessageIdRef.current = lastMessage.id as string
            break
          }
        }
      }
    }
  }, [messages, onProgressionsGenerated])

  // Load existing chat
  useEffect(() => {
    const normalizedChatId = chatId || null
    if (normalizedChatId !== currentChatIdRef.current) {
      setMessages([])
      currentChatIdRef.current = normalizedChatId
    }



    if (existingChat && existingChat.messages && existingChat.messages.length > 0) {
      if (currentChatIdRef.current === existingChat._id) {
        // Only update if we are not already showing these messages or if we just switched chats
        const lastMessage = messages[messages.length - 1]
        const existingLastMessage = existingChat.messages[existingChat.messages.length - 1]

        if (messages.length === 0 || (lastMessage && existingLastMessage && lastMessage.id !== existingLastMessage.id) || chatId !== currentChatIdRef.current) {
          // Use a simple heuristic: if we have more messages locally, we are probably ahead of the server
          // (e.g. optimistic updates or streaming response), so don't sync back yet.
          if (messages.length > existingChat.messages.length) {
            return
          }
          setMessages(existingChat.messages as any)
          const nextAudioById = new Map<string, StoredRecording[]>()
          for (const message of existingChat.messages) {
            const recordings = getAudioItemsFromParts(message.parts ?? []).filter(
              (recording): recording is StoredRecording => Boolean(recording.url || recording.storageId),
            )
            if (recordings.length > 0) {
              nextAudioById.set(String(message.id), recordings)
            }
          }
          setMessageAudioById(nextAudioById)
          if (existingChat.progressions && onProgressionsGenerated) {
            onProgressionsGenerated(existingChat.progressions, true)
          }
        }
      }
    }
  }, [existingChat, setMessages, onProgressionsGenerated, messages.length, chatId])

  useEffect(() => {
    if (status === 'error') {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && 'error' in lastMessage && lastMessage.error) {
        const errorMessage = typeof lastMessage.error === 'string'
          ? lastMessage.error
          : (lastMessage.error as any)?.message || 'An error occurred. Please try again.'
        setError(errorMessage)
      }
    }
  }, [status, messages])

  // Auto-send external prompt when provided
  const lastExternalPromptRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (messages.length > 0) {
      return
    }

    const hasPendingRecordings = recordingIds.length > 0

    if (hasPendingRecordings) {
      return
    }

    if (externalPrompt && externalPrompt !== lastExternalPromptRef.current && status === 'ready') {
      lastExternalPromptRef.current = externalPrompt
      setError(null)
      sendMessage(
        { text: externalPrompt },
        { body: { model: 'gpt-4o' } }
      )
    }
  }, [externalPrompt, status, sendMessage, messages.length, searchParams])

  useEffect(() => {
    if (status === 'streaming') {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 200)
      return () => clearTimeout(timer)
    }
    setIsTyping(false)
  }, [status])

  useEffect(() => {
    if (!pendingUserMessage) return

    const hasMatchingUserMessage = messages.some(
      (message) =>
        message.role === 'user' &&
        getMessageText(message).trim() === pendingUserMessage.text.trim(),
    )

    if (hasMatchingUserMessage) {
      setPendingUserMessage(null)
    }
  }, [messages, pendingUserMessage])

  useEffect(() => {
    if (pendingAudioHandledRef.current || status !== 'ready' || credits === undefined || anonymousSessionId === null) {
      return
    }

    if (recordingIds.length === 0) {
      return
    }

    if (pendingRecordings === undefined) {
      return
    }

    if (pendingRecordings.length === 0) {
      pendingAudioHandledRef.current = true
      setError('Could not load the uploaded recording.')
      return
    }

    const submitPendingRecordings = async () => {
      pendingAudioHandledRef.current = true

      const prompt =
        searchParams.get('prompt')?.trim() ||
        pendingRecordings[0]?.prompt?.trim() ||
        CHORD_IDENTIFICATION_PROMPT

      setPendingUserMessage({
        text: prompt,
        recordings: pendingRecordings.map((recording: { url: string; storageId: Id<'_storage'> }) => ({
          url: recording.url,
          storageId: recording.storageId,
        })),
      })
      lastSubmittedPromptRef.current = prompt

      try {
        const canUseCredit = await consumeCreditForSubmission()
        if (!canUseCredit) {
          setPendingUserMessage(null)
          return
        }

        lastExternalPromptRef.current = prompt

        await sendPromptWithOptionalAudio(
          prompt,
          pendingRecordings.map((recording: { url: string; storageId: Id<'_storage'>; id: Id<'pendingRecordings'> }) => ({
            url: recording.url,
            storageId: recording.storageId,
          })),
        )

        await consumePendingRecordings({
          ids: pendingRecordings.map((recording: { id: Id<'pendingRecordings'> }) => recording.id),
          sessionId: anonymousSessionId,
        })
      } catch (error: unknown) {
        setPendingUserMessage(null)
        const message = error instanceof Error ? error.message : 'Could not load the uploaded recording.'
        setError(message)
      }
    }

    void submitPendingRecordings()
  }, [status, credits, anonymousSessionId, searchParams, pendingRecordings, recordingIds.length])

  // Reset chat when resetKey changes (New Chat for anonymous users)
  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (resetKey && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey
      setMessages([])
      setError(null)
      currentChatIdRef.current = null

      textInput.setInput('')
      attachments.clear()
      audioProgressionsRef.current = []
      lastSubmittedPromptRef.current = null
      pendingRecordingsRef.current = []
      setMessageAudioById(new Map())
      setPendingUserMessage(null)
      setAudioToolPhase('idle')
    }
  }, [resetKey, setMessages, textInput, attachments])

  useEffect(() => {
    const pendingRecordings = pendingRecordingsRef.current
    const prompt = lastSubmittedPromptRef.current

    setMessageAudioById((prev) => {
      let next: Map<string, StoredRecording[]> | null = null
      const ensureNext = () => {
        if (!next) next = new Map(prev)
        return next
      }

      if (pendingRecordings.length && prompt) {
        const lastUserIndex = messages.findLastIndex((message) => message.role === 'user')
        if (lastUserIndex !== -1) {
          const message = messages[lastUserIndex]
          if (getMessageText(message).trim() === prompt.trim()) {
            const messageId = String(message.id)
            if (prev.get(messageId) !== pendingRecordings) {
              ensureNext().set(messageId, pendingRecordings)
            }
            pendingRecordingsRef.current = []

            for (const storedId of [...(next ?? prev).keys()]) {
              if (storedId !== messageId && !messages.some((entry) => String(entry.id) === storedId)) {
                ensureNext().delete(storedId)
              }
            }
          }
        }
      }

      if (prompt) {
        const lastUserIndex = messages.findLastIndex((message) => message.role === 'user')
        if (lastUserIndex !== -1) {
          const message = messages[lastUserIndex]
          const messageId = String(message.id)
          const map = next ?? prev

          if (!map.has(messageId)) {
            const orphanId = [...map.keys()].find(
              (storedId) => !messages.some((entry) => String(entry.id) === storedId),
            )

            if (orphanId && getMessageText(message).trim() === prompt.trim()) {
              const recordings = map.get(orphanId)
              if (recordings) {
                ensureNext().set(messageId, recordings)
                ensureNext().delete(orphanId)
              }
            }
          }
        }
      }

      return next ?? prev
    })
  }, [messages])

  // Save chat to Convex when messages change (allowing both authenticated and anonymous users with session)
  useEffect(() => {
    if (!isAuthenticated || messages.length === 0 || status !== 'ready') {
      return
    }

    // Don't save if we haven't received any new messages
    // Note: checking > ensures we only save when we add content. 
    // If we just loaded from DB, messages.length == lastSaved.
    if (messages.length <= lastSavedMessagesLengthRef.current) {
      return
    }

    const saveChat = async () => {
      const firstUserMessage = messages.find((m) => m.role === 'user')
      if (!firstUserMessage) return

      const title =
        'content' in firstUserMessage
          ? String(firstUserMessage.content).slice(0, 100)
          : firstUserMessage.parts?.find((p) => p.type === 'text' && 'text' in p)
            ? (firstUserMessage.parts.find((p) => p.type === 'text' && 'text' in p) as { text: string }).text.slice(0, 100)
            : 'New Chat'

      const messagesToSave = withAudioPartsForSave(
        messages.map((m) => ({
          id: String(m.id),
          role: m.role as 'user' | 'assistant',
          content: 'content' in m ? String(m.content || '') : '',
          parts: m.parts,
          createdAt: ((m as any).createdAt instanceof Date) ? (m as any).createdAt.getTime() : Date.now(),
        })),
        messageAudioById,
      )

      try {
        const progressions = [
          ...extractProgressionsFromMessages(messagesToSave),
          ...audioProgressionsRef.current,
        ]

        if (currentChatIdRef.current) {
          await updateChat({
            id: currentChatIdRef.current as Id<'chats'>,
            messages: messagesToSave,
            progressions: progressions,
          })
        }
        // Creation is handled by onFinish to avoid race conditions and duplicates

        lastSavedMessagesLengthRef.current = messages.length
      } catch (err) {
        console.error('Failed to save chat:', err)
      }
    }

    saveChat()
  }, [messages, status, isAuthenticated, createChat, updateChat, onChatCreated, router, searchParams])

  const consumeCreditForSubmission = async () => {
    if (credits === undefined) {
      setError('Loading credits...')
      return false
    }

    if (!isAuthenticated && credits.credits === 0) {
      setError('You have used all 3 free generations. Please sign in to continue.')
      return false
    }

    if (!isAuthenticated) {
      if (!anonymousSessionId) {
        setError('Session not initialized. Please refresh the page.')
        return false
      }
      const result = await useCredit({ anonymousSessionId })
      if (!result.success) {
        if (result.reason === 'limit_reached') {
          setError('You have used all 3 free generations. Please sign in to continue.')
        } else {
          setError('Failed to use credit. Please try again.')
        }
        return false
      }
    }

    return true
  }

  const analyzeAudioRecording = async (audioUrl: string, textToSend: string) => {
    setIsAnalyzingAudio(true)
    try {
      const response = await fetch('/api/audio-chords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl,
          prompt: textToSend,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not identify chords from this recording.')
      }

      if (!result.progression?.chords?.length) {
        return undefined
      }

      const identifiedProgression = result.progression as Progression
      audioProgressionsRef.current = [...audioProgressionsRef.current, identifiedProgression]
      onProgressionsGenerated?.([identifiedProgression])
      setAudioToolPhase('completed')

      return {
        summary: result.summary,
        notes: result.notes,
        chords: identifiedProgression.chords.map((chord) => chord.representation),
      }
    } catch (error: any) {
      setAudioToolPhase('idle')
      setError(error.message || 'Could not identify chords from this recording.')
      throw error
    } finally {
      setIsAnalyzingAudio(false)
    }
  }

  const sendPromptWithOptionalAudio = async (textToSend: string, recordings: StoredRecording[] = []) => {
    setError(null)
    setPendingUserMessage({ text: textToSend, recordings })
    pendingRecordingsRef.current = recordings
    lastSubmittedPromptRef.current = textToSend
    console.log('Sending message:', textToSend)

    // Update title for both anonymous and authenticated users for immediate feedback
    // setPrompt(textToSend) // This causes a double-send because it updates the URL, triggering a re-render/re-mount loop
    if (!isAuthenticated) {
      setPrompt(textToSend)
      // Prevent the auto-send effect from firing when the prompt prop updates via URL
      lastExternalPromptRef.current = textToSend
    }

    let audioChordAnalysis:
      | {
          summary?: string
          notes?: string
          chords: string[]
        }
      | undefined

    if (recordings.length > 0) {
      setAudioToolPhase('analyzing')
      const analyses = []

      for (const recording of recordings) {
        const analysis = await analyzeAudioRecording(recording.url, textToSend)
        if (analysis) analyses.push(analysis)
      }

      if (analyses.length === 0) {
        setAudioToolPhase('idle')
      }

      if (analyses.length > 0) {
        audioChordAnalysis = {
          summary: analyses.map((analysis) => analysis.summary).filter(Boolean).join(' '),
          notes: analyses.map((analysis) => analysis.notes).filter(Boolean).join(' '),
          chords: analyses.flatMap((analysis) => analysis.chords),
        }
      }
    }

    await sendMessage(
      { text: textToSend },
      {
        body: {
          model: 'gpt-4o',
          audioChordAnalysis,
        },
      },
    )

  }

  const uploadRecordingsFromPrompt = async (
    audioFiles: Array<{ url: string; filename?: string; mediaType?: string }>,
    prompt: string,
  ): Promise<StoredRecording[]> => {
    if (!anonymousSessionId) {
      throw new Error('Session not initialized.')
    }

    return Promise.all(
      audioFiles.map((file, index) =>
        uploadAudioSourceToConvex({
          audioUrl: file.url,
          sessionId: anonymousSessionId,
          prompt,
          filename: file.filename ?? `recording-${index + 1}.wav`,
          generateUploadUrl: () => generateUploadUrl(),
          createPendingRecording: (args) => createPendingRecording(args),
        }),
      ),
    )
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log('handleSubmit called', message)
    const hasText = Boolean(message.text?.trim())
    const audioFiles = message.files.filter((file) => file.mediaType?.startsWith('audio/') && file.url)
    const attachmentAudioFiles = attachments.files.filter((file) => file.mediaType?.startsWith('audio/'))
    const hasAudio = audioFiles.length > 0

    if (!hasText && !hasAudio) {
      console.log('No text in message, returning early')
      return
    }

    const textToSend = message.text?.trim() || (hasAudio ? CHORD_IDENTIFICATION_PROMPT : '')

    setPendingUserMessage({
      text: textToSend,
      recordings: hasAudio ? audioFiles.map((file) => ({ url: file.url })) : [],
    })
    lastSubmittedPromptRef.current = textToSend

    const canUseCredit = await consumeCreditForSubmission()
    if (!canUseCredit) {
      setPendingUserMessage(null)
      return
    }

    try {
      if (hasAudio) {
        for (const file of attachmentAudioFiles) {
          setFileUploading(file.id, true)
        }
      }

      const recordings = hasAudio ? await uploadRecordingsFromPrompt(audioFiles, textToSend) : []
      setPendingUserMessage({ text: textToSend, recordings })
      await sendPromptWithOptionalAudio(textToSend, recordings)
    } catch (error: any) {
      setPendingUserMessage(null)
      setError(error.message || 'Recording could not be uploaded.')
    } finally {
      if (hasAudio) {
        for (const file of attachmentAudioFiles) {
          setFileUploading(file.id, false)
        }
      }
    }
  }

  const hasAudio = attachments.files.some((file) => file.mediaType?.startsWith('audio/'))
  const hasText = Boolean(textInput.value?.trim())
  const canSubmit = (hasText || hasAudio) && status === 'ready' && !isAnalyzingAudio && credits !== undefined && anonymousSessionId !== null && (isAuthenticated || (credits.credits ?? 0) > 0)
  const showSignInPrompt = !isAuthenticated && credits !== undefined && credits.credits === 0
  const assistantHasProgressionTool = messages.some((message) => messageHasProgressionTool(message))
  const showAudioToolCard =
    (audioToolPhase === 'analyzing' || audioToolPhase === 'completed') && !assistantHasProgressionTool
  const isAwaitingAssistant = status === 'submitted' || isAnalyzingAudio

  return (
    <div className="flex flex-col h-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
            >
              <XIcon className="size-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}
      {showSignInPrompt && (
        <Alert className="mb-4">
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You've used all 3 free generations. Sign in to continue generating chord progressions.</span>
            <Button size="sm" onClick={handleSignIn}>Sign In</Button>
          </AlertDescription>
        </Alert>
      )}
      <ConversationWithFade className="flex-1 min-h-0">
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="pt-4 gap-4">
            {pendingUserMessage &&
              !messages.some(
                (message) =>
                  message.role === 'user' &&
                  getMessageText(message).trim() === pendingUserMessage.text.trim(),
              ) && (
                <div className="flex flex-col gap-2">
                  <Message
                    from="user"
                    className={pendingUserMessage.recordings.length > 0 ? 'gap-1' : undefined}
                  >
                    {pendingUserMessage.recordings.length > 0 && (
                      <div className="ml-auto max-w-full">
                        <MessageAudioRecordings
                          items={pendingUserMessage.recordings}
                          variant="chips"
                        />
                      </div>
                    )}
                    <MessageContent>
                      <MessageResponse>{pendingUserMessage.text}</MessageResponse>
                    </MessageContent>
                  </Message>
                </div>
              )}
            {showAudioToolCard && (
              <ChatToolCallCard
                isLoading={audioToolPhase === 'analyzing'}
                loadingLabel="Identifying Chords from Recording..."
                completedLabel="Identified Chords from Recording"
                onClick={
                  audioToolPhase === 'completed'
                    ? () => onToolClick?.('generateChordProgressions', null)
                    : undefined
                }
              />
            )}
            {(() => {
              const messagesToRender = [...messages]
              if (isAwaitingAssistant && messagesToRender.length > 0 && messagesToRender[messagesToRender.length - 1].role !== 'assistant') {
                messagesToRender.push({
                  id: 'generating-placeholder',
                  role: 'assistant',
                  content: '',
                  parts: [{ type: 'text', text: '' }]
                } as any)
              }

              return messagesToRender.map((message, messageIndex) => {
                const isLastMessage = messageIndex === messagesToRender.length - 1
                const showMascot =
                  isLastMessage &&
                  message.role === 'assistant' &&
                  (status === 'streaming' || status === 'submitted' || (isAnalyzingAudio && message.id === 'generating-placeholder'))

                return (
                  <div
                    key={message.id}
                    className="flex flex-col gap-2"
                  >
                    {message.parts ? (
                      (() => {
                        const textParts = message.parts.filter(
                          (part): part is { type: 'text'; text: string } =>
                            part.type === 'text' && 'text' in part,
                        )
                        const audioItems = getAudioItemsFromMessage(message, messageAudioById)
                        const toolParts = message.parts.filter(
                          (part) => isProgressionToolPart(part) && 'state' in part && 'input' in part,
                        )
                        const hasMessageContent = textParts.length > 0 || audioItems.length > 0

                        return (
                          <>
                            {hasMessageContent && (
                              <Message
                                from={message.role}
                                className={message.role === 'user' && audioItems.length > 0 ? 'gap-1' : undefined}
                              >
                                {message.role === 'user' && audioItems.length > 0 && (
                                  <div className="ml-auto max-w-full">
                                    <MessageAudioRecordings items={audioItems} variant="chips" />
                                  </div>
                                )}
                                {textParts.length > 0 && (
                                  <MessageContent>
                                    {textParts.map((part, i) => (
                                      <MessageResponse key={`${message.id}-text-${i}`}>
                                        {part.text}
                                      </MessageResponse>
                                    ))}
                                    {showMascot && message.role === 'assistant' && (
                                      <div className="text-left">
                                        <MascotCursor isTyping={isTyping} className="size-5 inline-block" />
                                      </div>
                                    )}
                                  </MessageContent>
                                )}
                              </Message>
                            )}
                            {(toolParts as Array<{ state?: string; output?: unknown }>).map((part, i) => {
                              const isLoading = part.state === 'input-streaming' || part.state === 'input-available'
                              const isCompleted = part.state === 'output-available'
                              return (
                                <ChatToolCallCard
                                  key={`${message.id}-tool-${i}`}
                                  isLoading={isLoading}
                                  loadingLabel="Generating Chord Progressions..."
                                  completedLabel="Generated Chord Progressions"
                                  onClick={
                                    isCompleted && onToolClick && 'output' in part
                                      ? () => onToolClick('generateChordProgressions', part.output)
                                      : undefined
                                  }
                                />
                              )
                            })}
                          </>
                        )
                      })()
                    ) : (
                      <Message
                        from={message.role}
                        className={
                          message.role === 'user' &&
                          getAudioItemsFromMessage(message, messageAudioById).length > 0
                            ? 'gap-1'
                            : undefined
                        }
                      >
                        {message.role === 'user' &&
                          getAudioItemsFromMessage(message, messageAudioById).length > 0 && (
                            <div className="ml-auto max-w-full">
                              <MessageAudioRecordings
                                items={getAudioItemsFromMessage(message, messageAudioById)}
                                variant="chips"
                              />
                            </div>
                          )}
                        <MessageContent>
                          <MessageResponse>
                            {'content' in message ? String(message.content || '') : ''}
                          </MessageResponse>
                          {showMascot && (
                            <div className="text-left">
                              <MascotCursor isTyping={isTyping} className="size-5 inline-block" />
                            </div>
                          )}
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                )
              })
            })()}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </ConversationWithFade>
      <PromptInput accept="audio/*" maxFiles={5} maxFileSize={10 * 1024 * 1024} onSubmit={handleSubmit}>
        <AudioAttachmentPreview variant="header" />
        <PromptInputBody>
          <PromptInputTextarea
            className={cn(hasAudio && 'pt-1.5')}
            placeholder={PROMPT_PLACEHOLDER}
          />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full items-end justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
            <AudioRecorderButton />
            {credits && !isAuthenticated && (
              <Badge variant="secondary" className="text-xs border-0">
                {credits.credits} / 3 free generations
              </Badge>
            )}
          </div>
          <div className="ml-auto">
            <PromptInputSubmit
              disabled={!canSubmit || status !== 'ready'}
              status={isAnalyzingAudio ? 'submitted' : status}
            />
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

export default function Chatbot({ prompt, chatId, onProgressionsGenerated, onChatCreated, resetKey, onToolClick }: ChatbotProps) {
  return (
    <PromptInputProvider>
      <AudioRecordingStatusProvider>
        <ChatbotContent
          prompt={prompt}
          chatId={chatId}
          onProgressionsGenerated={onProgressionsGenerated}
          onChatCreated={onChatCreated}
          resetKey={resetKey}
          onToolClick={onToolClick}
        />
      </AudioRecordingStatusProvider>
    </PromptInputProvider>
  )
}
