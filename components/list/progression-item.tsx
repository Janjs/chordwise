'use client'

import { Progression } from '@/types/types'
import { FC } from 'react'

interface ProgressionItemProps {
  index: number
  progression: Progression
  handlePlay: (i: number) => void
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const ProgressionItem: FC<ProgressionItemProps> = (props) => {
  const { index, progression, handlePlay, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <div
      onClick={() => handlePlay(index)}
      className={`mb-4 flex flex-row items-center gap-10 rounded-2xl 
         p-4 ${isPlaying(index) ? 'bg-card hover:bg-card' : 'border border-card hover:bg-secondary'} 
      `}
    >
      <div className="flex-1 columns-4 gap-4 rounded-lg">
        {progression.chords.map((chord, j) => (
          <h1
            key={j}
            className={`flex aspect-square items-center justify-center rounded-lg border text-2xl font-bold 
            ${isChordPlaying(j) ? 'bg-primary' : ''} 
            ${isPlaying(index) ? 'border-primary' : 'border-card'} 
            p-2`}
          >
            {chord.representation}
          </h1>
        ))}
      </div>
    </div>
  )
}

export default ProgressionItem
