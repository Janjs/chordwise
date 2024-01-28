'use client'

import { useState } from 'react'
import UserInput, { formSchema } from '@/components/user-input'
import * as z from 'zod'
import { Progression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import PlayerContainer from '@/components/player/player-container'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'

const Page = () => {
  const [loading, setLoading] = useState(false)
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [error, setError] = useState(null)

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    setError(null)
    setProgressions([])

    setTimeout(() => {
      fetch('/api/generateChords', {
        method: 'POST',
        body: JSON.stringify({
          description: values.description,
          musicalKey: values.musicalKey,
          musicalScale: values.musicalScale,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setProgressions(data.progressions)
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false))
    }, 1000)
  }

  return (
    <div className="flex h-full max-w-7xl flex-1 flex-col justify-between p-4">
      <div className="flex-1 overflow-auto">
        {progressions.length > 0 && <PlayerContainer progressions={progressions} />}
      </div>
      {error && (
        <Alert variant="destructive">
          <Icons.warning className="h-2 w-2" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <Separator className="mb-5 bg-card" />
      <div className="flex-none rounded-xl border bg-card p-3">
        <UserInput onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

export default Page
