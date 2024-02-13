'use client'

import { FC } from 'react'

import { Separator } from '@/components/ui/separator'
import Piano from './piano'
import { InstrumentContainerProps } from '../player/instrument-container'

const PianoListViewer: FC<InstrumentContainerProps> = (props) => {
  const { index, chordProgression, indexCurrentChord, isPlaying, pitch } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexCurrentChord === chord

  return (
    <div className="flex flex-col">
      <div className="flex-none">
        <Piano chord={chordProgression.chords[indexCurrentChord]} pitch={pitch} carousel={true} playing={true} />
        <Separator className="bg-background" />
      </div>
      <ul className="flex-1 grid overflow-auto">
        {chordProgression.chords.map((chord, i) => (
          <Piano key={i} chord={chord} pitch={pitch} carousel={false} playing={false} />
        ))}
      </ul>
    </div>
  )
}

export default PianoListViewer
