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
      className={`p-4 mb-4 flex flex-row rounded-2xl hover:bg-secondary overflow-x-auto gap-4
         ${isPlaying(index) ? 'bg-card' : 'border border-card'} 
      `}
    >
      {progression.chords.map((chord, j) => (
        <h1
          key={j}
          className={`flex-none width-with-gap
        aspect-square flex items-center justify-center rounded-lg border text-2xl font-bold 
            ${isChordPlaying(j) ? 'bg-primary' : ''} 
            ${isPlaying(index) ? 'border-primary' : 'border-card'}`}
        >
          {chord.representation}
        </h1>
      ))}
    </div>
  )
}

export default ProgressionItem
