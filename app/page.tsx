'use client'

import { useState } from 'react'
import UserInput, { formSchema } from '@/components/user-input'
import * as z from 'zod'
import { ChordProgression } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import Player from '@/components/player'
import { Icons } from '@/components/icons'

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
    <div className="flex flex-1 items-center justify-center">
      <h2 className="text-5xl font-bold">AI-Generated Chord Progression Ideas</h2>
    </div>
  )
}

export default Page
