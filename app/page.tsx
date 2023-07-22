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
  const [chordProgressions, setChordProgressions] = useState<
    ChordProgression[]
  >([])
  const [error, setError] = useState(null)
  const [otherResponse, setOtherResponse] = useState(null)

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    setError(null)
    setChordProgressions([])
    setOtherResponse(null)

    console.log(values)

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
  }

  return (
    <div className='p-5 h-full flex flex-col justify-center'>
      <div className='overflow-auto'>
        {chordProgressions.length > 0 && (
          <Player chordProgressions={chordProgressions} />
        )}
      </div>
      {otherResponse && (
        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertTitle>{otherResponse}</AlertTitle>
        </Alert>
      )}
      {error && (
        <Alert variant='destructive'>
          <Icons.warning className='h-4 w-4' />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <div className='flex-1 mt-5'>
        <UserInput onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

export default Page
