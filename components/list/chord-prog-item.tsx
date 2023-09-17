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
      className={`transition-colors duration-100 ease-in flex flex-row items-center 
         rounded-2xl mb-4 p-4 gap-10 ${
           isPlaying(index) ? 'bg-card hover:bg-card' : 'hover:bg-secondary border border-card'
         } 
      `}
    >
      <div className="flex-1 columns-4 rounded-lg gap-4">
        {chordProgression.chords.map((chord, j) => (
          <h1
            key={j}
            className={`font-bold text-3xl rounded-lg border aspect-square flex justify-center items-center 
            ${isChordPlaying(j) ? 'bg-primary' : ''} 
            ${isPlaying(index) ? '' : 'border-card'} 
            p-2`}
          >
            {chord.representation}
          </h1>
        ))}
      </div>
    </div>
  )
}

export default ChordProgItem
