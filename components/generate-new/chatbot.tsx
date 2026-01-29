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

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


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
  onProgressionsGenerated?: (progressions: Progression[]) => void
  onChatCreated?: (chatId: string) => void
  resetKey?: string | null
}

function ChatbotContent({ prompt: externalPrompt, chatId, onProgressionsGenerated, onChatCreated, resetKey }: ChatbotProps) {
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
    chatId ? { id: chatId as Id<'chats'> } : 'skip'
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
      // If authenticated and no chatId, create a new chat now that we have the first message/response
      if (isAuthenticated && !chatId && !currentChatIdRef.current) {
        try {
          // Use the prompt from URL params if available (set by handleSubmit), or try to find it in messages
          const promptParam = searchParams.get('prompt')
          const userMessage = messages.find(m => m.role === 'user')

          let title = promptParam
          if (!title && userMessage && typeof (userMessage as any).content === 'string') {
            title = (userMessage as any).content.slice(0, 50)
          }

          if (!title && lastSubmittedPromptRef.current) {
            title = lastSubmittedPromptRef.current.slice(0, 50)
          }

          // Create chat mutation
          const newChatId = await createChat({
            title: title || 'New Chat',
            messages: []
          })

          // We need to update the chat with the messages. 
          // The `createChat` might strictly create an empty chat or we need to pass messages.
          // Assuming `createChat` just creates the container. We might need to `updateChat` or similar.
          // Wait, based on `convex/chats.ts` (implied), `create` usually takes title. 
          // Then `updateChat` or internal logic handles messages.
          // Actually, `useChat` in `ai-sdk` doesn't automatically sync to Convex. 
          // We likely need to save the specific messages.

          // Let's look at how existing chats save.
          // There is a `useEffect` on line 309 (in original file) that saves messages when they change.
          // "Save chat to Convex when messages change"

          // If we redirect, that effect might run or might be cut off.
          // Safer to just redirect to the new ID, and let the existing or new page instance handle sync?
          // Or explicit save here?

          // The existing effect at line 309 says:
          // if (!isAuthenticated || messages.length === 0 || status !== 'ready') return
          // if (!chatId && !currentChatIdRef.current) return // This prevents saving if no ID

          // So:
          // 1. Create Chat -> get ID.
          currentChatIdRef.current = newChatId
          // 2. Redirect
          router.push(`/generate?chatId=${newChatId}`)
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
            onProgressionsGenerated(existingChat.progressions)
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
    if (externalPrompt && externalPrompt !== lastExternalPromptRef.current && status === 'ready') {
      lastExternalPromptRef.current = externalPrompt
      setError(null)
      setIsSuggestionsOpen(false)
      sendMessage(
        { text: externalPrompt },
        { body: { model: 'gpt-4o' } }
      )
    }
  }, [externalPrompt, status, sendMessage])

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
        createdAt: Date.now(),
      }))

      try {
        if (currentChatIdRef.current) {
          await updateChat({
            id: currentChatIdRef.current as Id<'chats'>,
            messages: messagesToSave,
          })
        }
        // Creation is handled by onFinish to avoid race conditions and duplicates

        lastSavedMessagesLengthRef.current = messages.length
      } catch (err) {
        console.error('Failed to save chat:', err)
      }
    }

    saveChat()
  }, [messages, status, isAuthenticated, anonymousSessionId, createChat, updateChat, onChatCreated, router, searchParams])

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
            {messages.map((message) => (
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
                            <MessageResponse>{part.text}</MessageResponse>
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
                        <div key={i} className={`flex items-center gap-2 p-3 rounded-md border bg-muted/30 transition-shadow ${isLoading ? 'shadow-[0_0_15px_hsl(var(--primary)/0.4)] animate-pulse' : ''}`}>
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
                    </MessageContent>
                  </Message>
                )}
              </div>
            ))}
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

export default function Chatbot({ prompt, chatId, onProgressionsGenerated, onChatCreated, resetKey }: ChatbotProps) {
  return (
    <PromptInputProvider>
      <ChatbotContent
        prompt={prompt}
        chatId={chatId}
        onProgressionsGenerated={onProgressionsGenerated}
        onChatCreated={onChatCreated}
        resetKey={resetKey}
      />
    </PromptInputProvider>
  )
}
