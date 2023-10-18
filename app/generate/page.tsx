'use client'

import { useState } from 'react'
import UserInput, { formSchema } from '@/components/user-input'
import * as z from 'zod'
import { ChordProgression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import Player from '@/components/player'
import { Icons } from '@/components/icons'
import { Separator } from '@/components/ui/separator'

const Page = () => {
  const [loading, setLoading] = useState(false)
  const [chordProgressions, setChordProgressions] = useState<ChordProgression[]>([])
  const [error, setError] = useState(null)

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    setError(null)
    setChordProgressions([])

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
          setChordProgressions(data.chordProgressions)
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false))
    }, 1000)
  }

  return (
    <div className="flex h-full max-w-7xl flex-1 flex-col justify-between pb-1 pl-3 pr-3">
      <div className="flex-1 overflow-auto">
        {chordProgressions.length > 0 && <Player chordProgressions={chordProgressions} />}
      </div>
      {error && (
        <Alert variant="destructive">
          <Icons.warning className="h-4 w-4" />
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
