'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import Chatbot from '@/components/generate-new/chatbot'
import { useInstrumentViewer } from '@/components/player/instrument-viewer-context'
import { DEFAULT_PITCH, DEFAULT_TEMPO, InstrumentTab } from '@/components/player/player-settings'
import { useSearchParams } from 'next/navigation'


export const dynamic = 'force-dynamic'


import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

const GenerateContent = () => {
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState<string | null>(null)
  const { setProps } = useInstrumentViewer()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined

  const [activeTab, setActiveTab] = useState<InstrumentTab>('midi')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)
  const [isPlaying, setIsPlaying] = useState(false)
  const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
  const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

  const prevChatIdRef = useRef<string | undefined>(undefined)
  const prevNewParamRef = useRef<string | null>(null)
  const newParam = searchParams.get('new')

  useEffect(() => {
    // If we are navigating to a new chat or clearing the current one
    const isChatSwitch = prevChatIdRef.current && chatId && prevChatIdRef.current !== chatId
    const isNewChat = prevChatIdRef.current && !chatId
    const isReset = newParam && newParam !== prevNewParamRef.current

    if (isChatSwitch || isNewChat || isReset) {
      setProgressions([])
      setIndexCurrentProgression(0)
      setIndexCurrentChord(-1)
      setIsPlaying(false)
    }

    prevChatIdRef.current = chatId
    prevNewParamRef.current = newParam
  }, [chatId, newParam])

  const handleProgressionsGenerated = (newProgressions: Progression[], shouldReplace: boolean = false) => {
    setProgressions((prevProgressions) => {
      let combined: Progression[]

      if (shouldReplace) {
        combined = newProgressions
      } else {
        // Deduplicate: Check if new progressions are already at the end of prevProgressions
        const prevSlice = prevProgressions.slice(-newProgressions.length)
        const isDuplicate = prevSlice.length === newProgressions.length &&
          JSON.stringify(prevSlice) === JSON.stringify(newProgressions)

        if (isDuplicate) {
          return prevProgressions
        }

        combined = [...prevProgressions, ...newProgressions]
      }

      const limited = combined.slice(-20)

      const totalCombined = combined.length
      const prevLen = prevProgressions.length
      // If replacing, we treat it as if we are starting fresh or jumping to the end, 
      // but typically replacement happens on load. 
      // If we replace, we probably want to select the first one if we were empty, 
      // or maintain index if it's just a sync.

      // Simplified logic for replacement:
      // If replacing, just reset to 0 if it's a new set, or keep valid.
      // The original logic was complex to handle appending. 

      if (shouldReplace) {
        setIndexCurrentProgression(0)
        setIndexCurrentChord(-1)
        return limited
      }

      const firstNewIndexInCombined = prevLen
      const firstIndexInLimited = Math.max(0, firstNewIndexInCombined - (totalCombined - limited.length))

      setIndexCurrentProgression(firstIndexInLimited)
      setIndexCurrentChord(-1)

      return limited
    })
    setError(null)
  }

  useEffect(() => {
    // Always update props so header/visualizer stays in sync
    const emptyProgression: Progression = { chords: [] }
    setProps({
      activeTab,
      setActiveTab,
      index: indexCurrentProgression,
      chordProgression: progressions.length > 0 ? progressions[indexCurrentProgression] : emptyProgression,
      indexCurrentChord,
      isPlaying: (i: number) => i === indexCurrentProgression,
      pitch,
      tempo,
      isCurrentlyPlaying: isPlaying,
    })
  }, [progressions, activeTab, indexCurrentProgression, indexCurrentChord, pitch, tempo, isPlaying, setProps, prompt])

  const handleToolClick = (toolName: string, output: any) => {
    if (isMobile) {
      setIsDrawerOpen(true)
    }
  }

  const playerContainer = (
    <PlayerContainer
      progressions={progressions}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tempo={tempo}
      setTempo={setTempo}
      pitch={pitch}
      setPitch={setPitch}
      isPlaying={isPlaying}
      setIsPlaying={setIsPlaying}
      indexCurrentProgression={indexCurrentProgression}
      setIndexCurrentProgression={setIndexCurrentProgression}
      indexCurrentChord={indexCurrentChord}
      setIndexCurrentChord={setIndexCurrentChord}
      isLoading={progressions.length === 0 && !!prompt}
    />
  )

  return (
    <div className="flex w-full max-w-full h-full gap-4 px-4 pb-4 overflow-hidden">
      {/* Left sidebar */}
      <div className="flex w-full md:w-72 lg:w-[25rem] flex-col gap-4 flex-shrink-0">
        {error && (
          <Alert variant="destructive">
            <Icons.warning className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
          </Alert>
        )}
        <Chatbot
          prompt={prompt}
          chatId={chatId}
          onProgressionsGenerated={handleProgressionsGenerated}
          resetKey={searchParams.get('new')}
          onToolClick={handleToolClick}
        />
      </div>

      {/* Main content - Desktop */}
      <div className="hidden md:block flex-1 min-w-0 min-h-0 overflow-hidden">
        {playerContainer}
      </div>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="h-[85vh] p-4">
            <div className="h-full overflow-hidden">
              {playerContainer}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}

const Page = () => {
  return (
    <Suspense fallback={null}>
      <GenerateContent />
    </Suspense>
  )
}

export default Page
