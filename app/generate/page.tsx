'use client'

import { Suspense, useEffect, useState } from 'react'
import { Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import Chatbot from '@/components/generate-new/chatbot'
import { useInstrumentViewer } from '@/components/player/instrument-viewer-context'
import { DEFAULT_PITCH, DEFAULT_TEMPO, InstrumentTab } from '@/components/player/player-settings'
import { useSearchParams } from 'next/navigation'


export const dynamic = 'force-dynamic'


const GenerateContent = () => {
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState<string | null>(null)
  const { setProps } = useInstrumentViewer()
  const searchParams = useSearchParams()

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined

  const [activeTab, setActiveTab] = useState<InstrumentTab>('midi')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)
  const [isPlaying, setIsPlaying] = useState(false)
  const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
  const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

  const handleProgressionsGenerated = (newProgressions: Progression[]) => {
    setProgressions((prevProgressions) => {
      const combined = [...prevProgressions, ...newProgressions]
      const limited = combined.slice(-20)

      const totalCombined = combined.length
      const prevLen = prevProgressions.length
      const firstNewIndexInCombined = prevLen
      const firstIndexInLimited = Math.max(0, firstNewIndexInCombined - (totalCombined - limited.length))

      setIndexCurrentProgression(firstIndexInLimited)
      setIndexCurrentChord(-1)

      return limited
    })
    setError(null)
  }

  useEffect(() => {
    const isLoading = progressions.length === 0 && !!prompt
    if (progressions.length > 0 || isLoading) {
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
    } else {
      setProps(null)
    }
  }, [progressions, activeTab, indexCurrentProgression, indexCurrentChord, pitch, tempo, isPlaying, setProps, prompt])

  return (
    <div className="flex w-full max-w-full h-full gap-4 px-4 pb-4 overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden md:flex w-[25rem] flex-col gap-4 flex-shrink-0">
        {error && (
          <Alert variant="destructive">
            <Icons.warning className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
          </Alert>
        )}
        <Chatbot prompt={prompt} chatId={chatId} onProgressionsGenerated={handleProgressionsGenerated} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        {progressions.length > 0 || prompt ? (
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
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Enter a prompt to generate chord progressions
          </div>
        )}
      </div>
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
