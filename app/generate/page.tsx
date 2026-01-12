'use client'

import { Suspense, useEffect, useState } from 'react'
import UserInput, { existsMusicalKey, formSchema } from '@/components/user-input'
import * as z from 'zod'
import { GenerateProgressionsRequest, GenerateProgressionsResponse, Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { SubmitHandler } from 'react-hook-form'
import { generateChordProgressions, reGenerate } from '@/app/_actions'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { Skeleton } from '@/components/ui/skeleton'

export type Inputs = z.infer<typeof formSchema>

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

  const handleSubmit: SubmitHandler<Inputs> = async (input) => {
    const generateProgressionsRequest: GenerateProgressionsRequest = {
      description: input.description,
      musicalKey: input.musicalKey,
      musicalScale: input.musicalScale,
    }
    if (
      input.description === params.description &&
      input.musicalKey === params.musicalKey &&
      input.musicalScale === params.musicalScale &&
      params.suggestionIndex === undefined
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
    <div className="flex h-full max-w-7xl flex-1 flex-col justify-between pb-0 md:pb-4 px-4 pt-10">
      <div className="flex-1 overflow-auto">
        {progressions.length > 0 ? (
          <PlayerContainer progressions={progressions} />
        ) : (
          <div className="w-full h-full overflow-auto grid md:grid-cols-2 gap-4">
            <div className="grid overflow-y-auto gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32 bg-card" />
              <Skeleton className="h-32 bg-card" />
              <Skeleton className="h-32 bg-card" />
              <Skeleton className="h-32 bg-card" />
            </div>
            <div className="flex flex-col gap-4 pb-4">
              <Skeleton className="h-[8vh] flex-none md:flex-1" />
            </div>
          </div>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <Icons.warning className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <Separator className="mb-4 bg-card hidden md:inline" />
      <div className="border rounded-lg bg-card">
        <UserInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}

const Page = () => {
  return (
    <Suspense fallback={
      <div className="flex h-full max-w-7xl flex-1 flex-col justify-between pb-0 md:pb-4 px-4 pt-10">
        <div className="w-full h-full overflow-auto grid md:grid-cols-2 gap-4">
          <div className="grid overflow-y-auto gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32 bg-card" />
            <Skeleton className="h-32 bg-card" />
            <Skeleton className="h-32 bg-card" />
            <Skeleton className="h-32 bg-card" />
          </div>
          <div className="flex flex-col gap-4 pb-4">
            <Skeleton className="h-[8vh] flex-none md:flex-1" />
          </div>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  )
}

export default Page
