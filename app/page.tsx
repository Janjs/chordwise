'use client'

import { useState } from 'react'
import UserInput, { formSchema } from '@/components/user-input'
import * as z from 'zod'
import { Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { SubmitHandler } from 'react-hook-form'
import { generateChordProgressions } from './_actions'

type Inputs = z.infer<typeof formSchema>

const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState(null)

  const handleSubmit: SubmitHandler<Inputs> = async (input) => {
    setIsLoading(true)
    setError(null)
    setProgressions([])

    try {
      const data = await generateChordProgressions(input)
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
