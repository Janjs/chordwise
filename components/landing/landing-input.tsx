'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import Link from 'next/link'

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const PROMPT_SUGGESTIONS = [
  'The Beatles songwriting style in A major',
  'Jazz ballad in G major',
  'Circle of fifths progression',
  'Power chords like Nirvana in F minor',
  'Backing track for Major 7th Pentatonic Scale in Bb major',
  'Melancholic vibe',
]

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

function LandingInputContent() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true)
  const lastAutoPromptRef = useRef<string>('')

  const { textInput } = usePromptInputController()

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
    const hasText = Boolean(message.text?.trim())
    if (!hasText) return

    const textToSend = message.text || constructPrompt()
    router.push(`/generate?prompt=${encodeURIComponent(textToSend)}`)
  }

  const defaultPrompt = constructPrompt()
  const hasSelections = selectedMood || selectedGenre || selectedKey
  const hasText = Boolean(textInput.value?.trim()) || hasSelections

  return (
    <div className="flex flex-col w-full max-w-xl items-center">
      <PromptInput onSubmit={handleSubmit} className="w-full">
        <PromptInputBody>
          <PromptInputTextarea placeholder={defaultPrompt} />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full justify-end">
          <PromptInputSubmit disabled={!hasText} />
        </PromptInputFooter>
      </PromptInput>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Icons.mascot className="h-5 w-5" />
          <p className="text-sm">Need inspiration? Try one of these:</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion, i) => (
            <Link key={i} href={`/generate?prompt=${encodeURIComponent(suggestion)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5">
                {suggestion}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingInput() {
  return (
    <PromptInputProvider>
      <LandingInputContent />
    </PromptInputProvider>
  )
}
