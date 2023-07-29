'use client'

import { ChordProgression } from '@/types/types'
import { FC } from 'react'

interface ChordProgItemProps {
  index: number
  chordProgression: ChordProgression
  handlePlay: (i: number) => void
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const ChordProgItem: FC<ChordProgItemProps> = (props) => {
  const { index, chordProgression, handlePlay, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <div
      onClick={() => handlePlay(index)}
      className={`transition-colors duration-150 ease-in flex flex-row items-center 
        border border-input rounded-2xl mb-4 p-4 gap-10 ${isPlaying(index) ? 'bg-muted' : ''} 
        hover:bg-muted [&>svg]:text-foreground hover:[&>svg]:text-background`}
    >
      <div className="flex-1 columns-4 rounded-lg gap-4">
        {chordProgression.chords.map((chord, i) => (
          <h1
            key={i}
            className={`font-bold border rounded-lg aspect-square flex justify-center items-center ${
              isChordPlaying(i) ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
            } p-2 [fill:currentColor !important]`}
          >
            {chord.representation}
          </h1>
        ))}
      </div>
    </div>
  )
}

export default ChordProgItem
