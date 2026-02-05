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
  PromptInputHeader,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  usePromptInputController,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Icons } from '@/components/icons'
import {
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Label } from '../ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { MascotCursor } from '@/components/mascot-cursor'

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

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


function SuggestionsWithFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport as HTMLElement
      setShowLeftFade(scrollLeft > 0)
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    viewport.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      viewport.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      {children}
    </div>
  )
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
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAutoPromptRef = useRef<string>('')
  const lastHandledToolMessageIdRef = useRef<string | null>(null)
  const currentChatIdRef = useRef<string | null>(chatId || null)
  const lastSavedMessagesLengthRef = useRef<number>(0)
  const lastSubmittedPromptRef = useRef<string | null>(null)

  const [isTyping, setIsTyping] = useState(false)

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
  const existingChat = useQuery(
    api.chats.get,
    chatId && isAuthenticated ? { id: chatId as Id<'chats'> } : 'skip'
  )

  const handleSignIn = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  const { textInput } = usePromptInputController()
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
            messagesToSave = messages.map(m => ({
              id: m.id,
              role: m.role,
              content: 'content' in m ? String(m.content || '') : '',
              parts: 'parts' in m ? m.parts : undefined,
              createdAt: (m as any).createdAt instanceof Date ? (m as any).createdAt.getTime() : Date.now()
            }))
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

          const progressions = extractProgressionsFromMessages(messagesToSave)

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
          if (existingChat.progressions && onProgressionsGenerated) {
            onProgressionsGenerated(existingChat.progressions, true)
          }
        }
      }
    }
  }, [existingChat, setMessages, onProgressionsGenerated, messages.length, chatId])

  useEffect(() => {
    if (status === 'submitted' || (messages.length > 0 && messages[messages.length - 1]?.role === 'user')) {
      setIsSuggestionsOpen(false)
    }
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
    if (externalPrompt && externalPrompt !== lastExternalPromptRef.current && status === 'ready') {
      lastExternalPromptRef.current = externalPrompt
      setError(null)
      setIsSuggestionsOpen(false)
      sendMessage(
        { text: externalPrompt },
        { body: { model: 'gpt-4o' } }
      )
    }
  }, [externalPrompt, status, sendMessage, messages.length])

  useEffect(() => {
    if (status === 'streaming') {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 200)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [messages, status])

  // Reset chat when resetKey changes (New Chat for anonymous users)
  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (resetKey && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey
      setMessages([])
      setError(null)
      setIsSuggestionsOpen(true)
      // Reset current chat ID too if we want to force full reset
      currentChatIdRef.current = null

      // Clear input and suggestions
      textInput.setInput('')
      setSelectedMood(null)
      setSelectedGenre(null)
      setSelectedKey(null)
      lastSubmittedPromptRef.current = null
    }
  }, [resetKey, setMessages, textInput])

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

      const messagesToSave = messages.map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: 'content' in m ? String(m.content || '') : '',
        parts: m.parts,
        createdAt: ((m as any).createdAt instanceof Date) ? (m as any).createdAt.getTime() : Date.now(),
      }))

      try {
        const progressions = extractProgressionsFromMessages(messagesToSave)

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

  const constructPrompt = () => {
    const parts: string[] = []
    if (selectedMood) parts.push(selectedMood.toLowerCase())
    if (selectedGenre) parts.push(selectedGenre.toLowerCase())
    if (selectedKey) parts.push(`in ${selectedKey} major`)

    if (parts.length === 0) {
      return 'e.g., happy jazz progressions in C major'
    }

    let prompt = parts.join(' ') + ' chord progressions'

    if (selectedKey) {
      prompt += ` (Key: ${selectedKey} major)`
    }

    return prompt
  }

  useEffect(() => {
    const prompt = constructPrompt()
    if (prompt !== 'e.g., happy jazz progressions in C major') {
      const currentText = textInput.value || ''
      if (currentText === '' || currentText === lastAutoPromptRef.current) {
        textInput.setInput(prompt)
        lastAutoPromptRef.current = prompt
      }
    } else {
      if (!textInput.value || textInput.value === lastAutoPromptRef.current) {
        textInput.setInput('')
      }
      lastAutoPromptRef.current = ''
    }
  }, [selectedMood, selectedGenre, selectedKey])

  const handleMoodClick = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood)
  }

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre)
  }

  const handleKeyClick = (key: string) => {
    setSelectedKey(selectedKey === key ? null : key)
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log('handleSubmit called', message)
    const hasText = Boolean(message.text?.trim())
    if (!hasText) {
      console.log('No text in message, returning early')
      return
    }

    if (credits === undefined) {
      setError('Loading credits...')
      return
    }

    if (!isAuthenticated && credits.credits === 0) {
      setError('You have used all 3 free generations. Please sign in to continue.')
      return
    }

    if (!isAuthenticated) {
      if (!anonymousSessionId) {
        setError('Session not initialized. Please refresh the page.')
        return
      }
      const result = await useCredit({ anonymousSessionId })
      if (!result.success) {
        if (result.reason === 'limit_reached') {
          setError('You have used all 3 free generations. Please sign in to continue.')
        } else {
          setError('Failed to use credit. Please try again.')
        }
        return
      }
    }

    setError(null)
    const textToSend = message.text || constructPrompt()
    console.log('Sending message:', textToSend)

    // Update title for both anonymous and authenticated users for immediate feedback
    // setPrompt(textToSend) // This causes a double-send because it updates the URL, triggering a re-render/re-mount loop
    if (!isAuthenticated) {
      setPrompt(textToSend)
      // Prevent the auto-send effect from firing when the prompt prop updates via URL
      lastExternalPromptRef.current = textToSend
    }
    lastSubmittedPromptRef.current = textToSend

    sendMessage(
      { text: textToSend },
      {
        body: {
          model: 'gpt-4o',
        },
      }
    )

    setSelectedMood(null)
    setSelectedGenre(null)
    setSelectedKey(null)
    setIsSuggestionsOpen(false)
  }

  const defaultPrompt = constructPrompt()
  const hasSelections = selectedMood || selectedGenre || selectedKey
  const hasText = Boolean(textInput.value?.trim()) || hasSelections
  const canSubmit = hasText && status === 'ready' && credits !== undefined && anonymousSessionId !== null && (isAuthenticated || (credits.credits ?? 0) > 0)
  const showSignInPrompt = !isAuthenticated && credits !== undefined && credits.credits === 0

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
          <ConversationContent className="pt-8 gap-4">
            {(() => {
              const messagesToRender = [...messages]
              if (status === 'submitted' && messagesToRender.length > 0 && messagesToRender[messagesToRender.length - 1].role !== 'assistant') {
                messagesToRender.push({
                  id: 'generating-placeholder',
                  role: 'assistant',
                  content: '',
                  parts: [{ type: 'text', text: '' }]
                } as any)
              }

              return messagesToRender.map((message, messageIndex) => {
                const isLastMessage = messageIndex === messagesToRender.length - 1
                const showMascot = isLastMessage && message.role === 'assistant' && (status === 'streaming' || status === 'submitted')

                return (
                  <div
                    key={message.id}
                    className="flex flex-col gap-2"
                  >
                    {message.parts ? (
                      message.parts.map((part, i) => {
                        if (part.type === 'text' && 'text' in part) {
                          return (
                            <Message key={`${message.id}-${i}`} from={message.role}>
                              <MessageContent>
                                <MessageResponse>
                                  {part.text}
                                </MessageResponse>
                                {showMascot && i === (message.parts?.length ?? 0) - 1 && (
                                  <div className="text-left">
                                    <MascotCursor isTyping={isTyping} className="size-5 inline-block" />
                                  </div>
                                )}
                              </MessageContent>
                            </Message>
                          )
                        }
                        if (
                          (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
                          'state' in part &&
                          'input' in part
                        ) {
                          const isLoading = part.state === 'input-streaming' || part.state === 'input-available'
                          const isCompleted = part.state === 'output-available'
                          const MascotIcon = isLoading ? Icons.mascotSleeping : Icons.mascot
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 p-3 rounded-md border bg-muted/30 transition-shadow ${isLoading ? 'shadow-[0_0_15px_hsl(var(--primary)/0.4)] animate-pulse' : ''} ${isCompleted ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                              onClick={() => {
                                if (isCompleted && onToolClick && 'output' in part) {
                                  onToolClick('generateChordProgressions', part.output)
                                }
                              }}
                            >
                              <MascotIcon className={`size-5 ${isLoading ? 'opacity-50' : ''}`} />
                              <span className="text-sm font-medium">
                                {isLoading ? 'Generating Chord Progressions...' : isCompleted ? 'Generated Chord Progressions' : 'Chord Progression Tool'}
                              </span>
                            </div>
                          )
                        }
                        return null
                      })
                    ) : (
                      <Message from={message.role}>
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
      <Collapsible open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} className="group">
        <CollapsibleTrigger className="flex items-center justify-between gap-2 mb-1.5 w-full">
          <Label className="text-sm font-semibold text-muted-foreground">Suggestions</Label>
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Label className="mb-3 text-xs text-muted-foreground">Mood</Label>
          <SuggestionsWithFade className="my-1">
            <Suggestions>
              {MOODS.map((mood) => (
                <Suggestion
                  size="sm"
                  key={mood}
                  suggestion={mood}
                  selected={selectedMood === mood}
                  onClick={handleMoodClick}
                />
              ))}
            </Suggestions>
          </SuggestionsWithFade>
          <Label className="mb-2 text-xs text-muted-foreground">Genre</Label>
          <SuggestionsWithFade className="my-1">
            <Suggestions>
              {GENRES.map((genre) => (
                <Suggestion
                  key={genre}
                  suggestion={genre}
                  selected={selectedGenre === genre}
                  onClick={handleGenreClick}
                />
              ))}
            </Suggestions>
          </SuggestionsWithFade>
          <Label className="mb-2 text-xs text-muted-foreground">Key</Label>
          <SuggestionsWithFade className="my-1">
            <Suggestions className="mb-2">
              {KEYS.map((key) => (
                <Suggestion
                  key={key}
                  suggestion={key}
                  selected={selectedKey === key}
                  onClick={handleKeyClick}
                />
              ))}
            </Suggestions>
          </SuggestionsWithFade>
        </CollapsibleContent>
      </Collapsible>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea placeholder={defaultPrompt} />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full items-end justify-between">
          {credits && !isAuthenticated && (
            <Badge variant="secondary" className="text-xs border-0">
              {credits.credits} / 3 free generations
            </Badge>
          )}
          <div className="ml-auto">
            <PromptInputSubmit
              disabled={!canSubmit || status !== 'ready'}
              status={status}
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
      <ChatbotContent
        prompt={prompt}
        chatId={chatId}
        onProgressionsGenerated={onProgressionsGenerated}
        onChatCreated={onChatCreated}
        resetKey={resetKey}
        onToolClick={onToolClick}
      />
    </PromptInputProvider>
  )
}
