'use client'

import { useCallback, useEffect, useState } from 'react'
import UserInput, { formSchema } from '@/components/user-input'
import * as z from 'zod'
import { GenerateProgressionsRequest, Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { SubmitHandler } from 'react-hook-form'
import { generateChordProgressions } from './_actions'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Inputs = z.infer<typeof formSchema>

const DESCRIPTION_KEY = 'description'
const MUSICAL_KEY_KEY = 'musicalKey'
const MUSICAL_SCALE_KEY = 'musicalScale'

const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const description = searchParams.get(DESCRIPTION_KEY)
  const musicalKey = searchParams.get(MUSICAL_KEY_KEY)
  const musicalScale = searchParams.get(MUSICAL_SCALE_KEY)

  useEffect(() => {
    if (description && musicalKey && musicalScale) {
      // TODO: validate musicalKey && musicalScale
      fetchData(description, musicalKey, musicalScale)
    }
  }, [searchParams])

  const createQueryString = useCallback(
    (input: Inputs) => {
      const params = new URLSearchParams(searchParams.toString())

      params.set(DESCRIPTION_KEY, input.description)
      params.set(MUSICAL_KEY_KEY, input.musicalKey)
      params.set(MUSICAL_SCALE_KEY, input.musicalScale)

      return params.toString()
    },
    [searchParams],
  )

  const handleSubmit: SubmitHandler<Inputs> = async (input) => {
    router.push(pathname + '?' + createQueryString(input))
  }

  const fetchData = async (description: string, musicalKey: string, musicalScale: string) => {
    setIsLoading(true)
    setError(null)
    setProgressions([])

    try {
      const generateProgressionsRequest: GenerateProgressionsRequest = {
        description,
        musicalKey,
        musicalScale,
      }
      const data = await generateChordProgressions(generateProgressionsRequest)
      setProgressions(data.progressions)
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
      <div className="flex-none rounded-xl border bg-card p-3">
        <UserInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default Page
