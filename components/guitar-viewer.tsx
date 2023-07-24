'use client'

import { FC, useRef, useState } from 'react'
import ChordViewer from './chord-viewer'

interface GuitarChordsViewerProps {
  index: number
  chordProgression: string[]
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const GuitarChordsViewer: FC<GuitarChordsViewerProps> = (props) => {
  const { index, chordProgression, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <div
      className={`transition-colors duration-150 ease-in flex flex-row items-center 
        border border-input rounded-2xl mb-4 p-4 gap-10 ${isPlaying(index) ? 'bg-muted' : ''} 
        hover:bg-muted [&>svg]:text-foreground hover:[&>svg]:text-background`}
    >
      <div className="flex-1 columns-4 rounded-lg gap-4">
        {chordProgression.map((chord, i) => (
          <ChordViewer key={i} chord={chord} />
        ))}
      </div>
    </div>
  )
}

export default GuitarChordsViewer
