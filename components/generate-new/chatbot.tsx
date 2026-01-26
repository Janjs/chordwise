'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { Progression } from '@/types/types'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
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
  onProgressionsGenerated?: (progressions: Progression[]) => void
}

function ChatbotContent({ prompt: externalPrompt, onProgressionsGenerated }: ChatbotProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAutoPromptRef = useRef<string>('')
  const latestUserMessageRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(0)
  const scrollViewportRef = useRef<HTMLElement | null>(null)

  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const useCredit = useMutation(api.credits.useCredit)

  const handleViewportReady = useCallback((viewport: HTMLElement | null) => {
    scrollViewportRef.current = viewport
  }, [])

  const { textInput } = usePromptInputController()

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    onError: (error: Error) => {
      console.error('Chat error:', error)
      setError(error.message || 'An error occurred. Please try again.')
    },
  } as any)

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.parts) {
      for (const part of lastMessage.parts) {
        if (
          (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
          'state' in part &&
          part.state === 'output-available' &&
          'output' in part &&
          part.output
        ) {
          const toolName = 'toolName' in part ? part.toolName : (typeof part.type === 'string' ? part.type.split('-').slice(1).join('-') : '')
          if (toolName === 'generateChordProgressions') {
            const result = part.output as { success: boolean; progressions?: Progression[]; error?: string }
            if (result.success && result.progressions && onProgressionsGenerated) {
              onProgressionsGenerated(result.progressions)
            }
          }
        }
      }
    }
  }, [messages, onProgressionsGenerated])

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

  // Scroll latest user message to top when a new message is added
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (
      messages.length > prevMessagesLengthRef.current &&
      lastMessage?.role === 'user'
    ) {
      // Wait for DOM to update and layout to complete
      requestAnimationFrame(() => {
        const viewport = scrollViewportRef.current
        const messageEl = latestUserMessageRef.current
        if (!viewport || !messageEl) return

        // Calculate position relative to scroll container using bounding rects
        const viewportRect = viewport.getBoundingClientRect()
        const messageRect = messageEl.getBoundingClientRect()
        const scrollTop = viewport.scrollTop + (messageRect.top - viewportRect.top)
        viewport.scrollTo({ top: scrollTop, behavior: 'smooth' })
      })
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages])

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

    if (!credits.isAuthenticated && credits.credits === 0) {
      setError('You have used all 3 free prompts. Please sign in to continue.')
      return
    }

    if (!credits.isAuthenticated) {
      if (!anonymousSessionId) {
        setError('Session not initialized. Please refresh the page.')
        return
      }
      const result = await useCredit({ anonymousSessionId })
      if (!result.success) {
        if (result.reason === 'limit_reached') {
          setError('You have used all 3 free prompts. Please sign in to continue.')
        } else {
          setError('Failed to use credit. Please try again.')
        }
        return
      }
    }

    setError(null)
    const textToSend = message.text || constructPrompt()
    console.log('Sending message:', textToSend)

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
  const canSubmit = hasText && status === 'ready' && credits !== undefined && anonymousSessionId !== null && (credits.isAuthenticated || (credits.credits ?? 0) > 0)
  const showSignInPrompt = !credits?.isAuthenticated && credits !== undefined && credits.credits === 0

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
            <span>You've used all 3 free prompts. Sign in to continue generating chord progressions.</span>
            <Button size="sm" disabled>Sign In</Button>
          </AlertDescription>
        </Alert>
      )}
      <ConversationWithFade className="flex-1 min-h-0" onViewportReady={handleViewportReady}>
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="pt-8 gap-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="flex flex-col gap-2"
              ref={message.role === 'user' && index === messages.length - 1 ? latestUserMessageRef : undefined}
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
          {/* Spacer to allow scrolling last user message to top */}
          {messages.length > 0 && <div className="min-h-[50vh]" />}
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
        <PromptInputFooter className="flex w-full justify-end">
          <PromptInputSubmit 
            disabled={!canSubmit || status !== 'ready'} 
            status={status} 
          />
        </PromptInputFooter>
        </PromptInput>
    </div>
  )
}

export default function Chatbot({ prompt, onProgressionsGenerated }: ChatbotProps) {
  return (
    <PromptInputProvider>
      <ChatbotContent
        prompt={prompt}
        onProgressionsGenerated={onProgressionsGenerated}
      />
    </PromptInputProvider>
  )
}
