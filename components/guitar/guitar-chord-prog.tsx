'use client'

import { FC, useRef, useState } from 'react'
import GuitarChord from './guitar-chord'
import { ChordProgression } from '@/types/types'
import { Chord } from '@/types/types'

interface GuitarChordProgViewerProps {
  index: number
  chordProgression: ChordProgression
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const GuitarChordProgViewer: FC<GuitarChordProgViewerProps> = (props) => {
  const { index, chordProgression, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <div
      className={`transition-colors duration-150 ease-in flex flex-row items-center 
        border border-input rounded-2xl mb-4 p-4 gap-10 ${isPlaying(index) ? 'bg-muted' : ''} 
        hover:bg-muted [&>svg]:text-foreground hover:[&>svg]:text-background`}
    >
      <div className="flex-1 columns-4 rounded-lg gap-4">
        {chordProgression.chords.map((chord, i) => (
          <GuitarChord key={i} chord={chord} />
        ))}
      </div>
    </div>
  )
}

export default GuitarChordProgViewer
