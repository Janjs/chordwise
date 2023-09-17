'use client'

import { FC, useRef, useState } from 'react'
import GuitarChord from './guitar-chord'
import { ChordProgression } from '@/types/types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
    <div className="flex-none rounded-xl p-5 flex flex-row items-center bg-card hover:bg-secondary">
      <AlertDialog>
        <AlertDialogTrigger>
          <div className="flex-1 columns-4">
            {chordProgression.chords.map((chord, i) => (
              <GuitarChord key={i} chord={chord} dialog={false} />
            ))}
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <div className="flex-1 columns-2">
            {chordProgression.chords.map((chord, i) => (
              <GuitarChord key={i} chord={chord} dialog={true} />
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GuitarChordProgViewer
