'use client'

import { useEffect, useState } from 'react'
import UserInput, { existsMusicalKey, existsMusicalScale, formSchema } from '@/components/user-input'
import * as z from 'zod'
import { GenerateProgressionsRequest, GenerateProgressionsResponse, Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { SubmitHandler } from 'react-hook-form'
import { generateChordProgressions, reGenerate } from '@/app/_actions'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'

export type Inputs = z.infer<typeof formSchema>

const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState<string | null>(null)

  const [params, setParams] = useGenerateSearchParams()

  useEffect(() => {
    if (params.description && params.musicalKey && params.musicalScale && existsMusicalKey(params.musicalKey)) {
      fetchData(params)
    }
  }, [params])

  const handleSubmit: SubmitHandler<Inputs> = async (input) => {
    const generateProgressionsRequest: GenerateProgressionsRequest = {
      description: input.description,
      musicalKey: input.musicalKey,
      musicalScale: input.musicalScale,
    }
    if (
      input.description === params.description &&
      input.musicalKey === params.musicalKey &&
      input.musicalScale === params.musicalScale
    ) {
      reGenerate()
    } else {
      setParams(generateProgressionsRequest)
    }
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
    <div className="flex h-full max-w-7xl flex-1 flex-col justify-between p-4">
      <div className="flex-1 overflow-auto">
        {progressions.length > 0 && <PlayerContainer progressions={progressions} />}
      </div>
      {error && (
        <Alert variant="destructive">
          <Icons.warning className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <Separator className="mb-5 bg-card" />
      <div className="md:border md:rounded-lg md:bg-card">
        <UserInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default Page
