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
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Loader } from '@/components/ai-elements/loader'
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
import { ChevronDownIcon } from 'lucide-react'

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

interface ChatbotProps {
  onGenerate: (prompt: string, key: string, scale: string) => void
  onProgressionsGenerated?: (progressions: Progression[]) => void
  isLoading: boolean
}

export default function Chatbot({ onGenerate, onProgressionsGenerated, isLoading }: ChatbotProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true)

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error)
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
  }, [status, messages])

  const constructPrompt = () => {
    const parts: string[] = []
    if (selectedMood) parts.push(selectedMood.toLowerCase())
    if (selectedGenre) parts.push(selectedGenre.toLowerCase())
    if (selectedKey) parts.push(`in ${selectedKey} major`)

    if (parts.length === 0) {
      return 'What would you like to know?'
    }

    let prompt = parts.join(' ') + ' chord progressions'

    if (selectedKey) {
      prompt += ` (Key: ${selectedKey} major)`
    }

    return prompt
  }

  const handleSubmit = (message: PromptInputMessage) => {
    console.log('handleSubmit called', message)
    const hasText = Boolean(message.text)
    if (!hasText) {
      console.log('No text in message, returning early')
      return
    }

    const textToSend = message.text || constructPrompt()
    console.log('Sending message:', textToSend)

    sendMessage(
      { text: textToSend },
      {
        body: {
          model: 'gpt-4o-mini',
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

  return (
    <div className="flex flex-col h-full">
      
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
                    const toolName = 'toolName' in part ? part.toolName : undefined
                    return (
                      <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                        <ToolHeader
                          type={part.type as any}
                          state={part.state as any}
                          toolName={toolName}
                        />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          {'state' in part && part.state === 'output-available' && 'output' in part && (
                            <ToolOutput output={part.output} errorText={'errorText' in part ? part.errorText : undefined} />
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
                    <MessageResponse>{'content' in message ? String(message.content || '') : ''}</MessageResponse>
                  </MessageContent>
                </Message>
              )}
            </div>
          ))}
          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <Collapsible open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} className="group">
        <CollapsibleTrigger className="flex items-center gap-2 mb-1.5 w-full">
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
                    onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
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
                    onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
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
                    onClick={() => setSelectedKey(selectedKey === key ? null : key)}
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
            disabled={status === 'error' || status === 'submitted' || status === 'streaming'} 
            status={status} 
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
