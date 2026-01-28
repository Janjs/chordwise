'use client'

import { FC } from 'react'
import GuitarChord from './guitar-chord'
import { Card, CardContent } from '@/components/ui/card'
import { InstrumentContainerProps } from '../player/instrument-container'

const GuitarProgViewer: FC<InstrumentContainerProps> = (props) => {
  const { index, chordProgression, indexCurrentChord, isPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexCurrentChord === chord

  if (!chordProgression.chords.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No guitar chords to display
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col border-0 bg-transparent shadow-none">
      <CardContent className="flex-1 overflow-auto pt-4 px-4">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {chordProgression.chords.map((chord, i) => (
            <li
              key={i}
              className="flex items-center justify-center rounded-lg border bg-card/40 px-4 py-6"
            >
              <GuitarChord chord={chord} current={isChordPlaying(i)} carousel={false} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default GuitarProgViewer
