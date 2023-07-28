'use client'

import { useState } from 'react'
import UserInput, { formSchema } from '../components/user-input'
import * as z from 'zod'
import { Separator } from '../components/ui/separator'
import { ChordProgression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import Player from '@/components/player'
import { Icons } from '@/components/icons'

const Page = () => {
  const [loading, setLoading] = useState(false)
  const [chordProgressions, setChordProgressions] = useState<ChordProgression[]>([])
  const [error, setError] = useState(null)
  const [otherResponse, setOtherResponse] = useState(null)

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    setError(null)
    setChordProgressions([])
    setOtherResponse(null)

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
          console.log(data)
          if (data.found) {
            setChordProgressions(data.chordProgressions)
          } else {
            setOtherResponse(data.otherResponse)
          }
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false))
    }, 1000)

    console.log(values)
  }

  return (
    <div className="flex-1 max-w-7xl p-5 flex flex-col h-full justify-between gap-5">
      <div className="flex-1 overflow-auto">
        {chordProgressions.length > 0 && <Player chordProgressions={chordProgressions} />}
      </div>
      {otherResponse && (
        <Alert>
          <Icons.info className="h-4 w-4" />
          <AlertTitle>{otherResponse}</AlertTitle>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <Icons.warning className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <div className="flex-none">
        <UserInput onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

export default Page
