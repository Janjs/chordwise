'use client'

import { Suspense, useEffect, useState } from 'react'
import { existsMusicalKey } from '@/components/user-input'
import { GenerateProgressionsRequest, GenerateProgressionsResponse, Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { generateChordProgressions, reGenerate } from '@/app/_actions'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import Chatbot from '@/components/generate-new/chatbot'


export const dynamic = 'force-dynamic'


const GenerateContent = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState<string | null>(null)

  const [params, setParams] = useGenerateSearchParams()

  useEffect(() => {
    if (params.description && params.musicalKey && params.musicalScale && existsMusicalKey(params.musicalKey)) {
      fetchData(params)
    }
  }, [params])

  const handleGenerate = async (prompt: string, key: string, scale: string) => {
    const generateProgressionsRequest: GenerateProgressionsRequest = {
      description: prompt,
      musicalKey: key,
      musicalScale: scale,
    }
    if (
      prompt === params.description &&
      key === params.musicalKey &&
      scale === params.musicalScale &&
      params.suggestionIndex === undefined
    ) {
      reGenerate()
    } else {
      setParams(generateProgressionsRequest)
    }
  }

  const handleProgressionsGenerated = (progressions: Progression[]) => {
    setProgressions(progressions)
    setIsLoading(false)
    setError(null)
  }

  const fetchData = async (generateProgressionsRequest: GenerateProgressionsRequest) => {
    setIsLoading(true)
    setError(null)
    setProgressions([])

    try {
      const response: GenerateProgressionsResponse = await generateChordProgressions(generateProgressionsRequest)

      if (response.progressions) setProgressions(response.progressions)
      else if (response.error) setError(response.error)
      else throw Error('Error while generating chord progressions.')
    } catch (error: any) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full h-full gap-4 px-4 pb-4 overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden md:flex w-80 min-w-80 flex-col gap-4 flex-shrink-0">
        {error && (
          <Alert variant="destructive">
            <Icons.warning className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
          </Alert>
        )}
        <Chatbot onGenerate={handleGenerate} onProgressionsGenerated={handleProgressionsGenerated} isLoading={isLoading} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        {progressions.length > 0 ? (
          <PlayerContainer progressions={progressions} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {isLoading ? 'Generating progressions...' : 'Enter a prompt to generate chord progressions'}
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
