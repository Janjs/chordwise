'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { Progression } from '@/types/types'
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
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
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
import { ChevronDownIcon, XIcon } from 'lucide-react'

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  generateChordProgressions: 'Generate Chord Progressions',
}

function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || toolName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
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


interface ChatbotProps {
  onGenerate: (prompt: string, key: string, scale: string) => void
  onProgressionsGenerated?: (progressions: Progression[]) => void
  isLoading: boolean
}

function ChatbotContent({ onGenerate, onProgressionsGenerated, isLoading }: ChatbotProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastAutoPromptRef = useRef<string>('')

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

  const handleSubmit = (message: PromptInputMessage) => {
    console.log('handleSubmit called', message)
    const hasText = Boolean(message.text?.trim())
    if (!hasText) {
      console.log('No text in message, returning early')
      return
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

  return (
    <div className="flex flex-col h-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
            >
              <XIcon className="size-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}
      <Conversation className="flex-1">
          <ConversationContent>
          {messages.map((message) => (
            <div key={message.id}>
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
                    const toolName = 'toolName' in part ? part.toolName : (typeof part.type === 'string' ? part.type.replace('tool-', '') : 'tool')
                    const toolDisplayName = getToolDisplayName(toolName)
                    return (
                      <Tool key={i} defaultOpen={part.state === 'output-available' || part.state === 'output-error'}>
                        <ToolHeader
                          type={part.type as any}
                          state={part.state as any}
                          toolName={toolName}
                          title={toolDisplayName}
                        />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          {'state' in part && (part.state === 'output-available' || part.state === 'output-error') && (
                            <ToolOutput 
                              output={'output' in part ? part.output : undefined}
                              errorText={'errorText' in part ? part.errorText : undefined}
                            />
                          )}
                        </ToolContent>
                      </Tool>
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
            disabled={!hasText || status === 'error' || status === 'submitted' || status === 'streaming'} 
            status={status} 
          />
        </PromptInputFooter>
        </PromptInput>
    </div>
  )
}

export default function Chatbot({ onGenerate, onProgressionsGenerated, isLoading }: ChatbotProps) {
  return (
    <PromptInputProvider>
      <ChatbotContent 
        onGenerate={onGenerate} 
        onProgressionsGenerated={onProgressionsGenerated} 
        isLoading={isLoading} 
      />
    </PromptInputProvider>
  )
}
