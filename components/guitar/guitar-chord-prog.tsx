'use client'

import { FC, useRef, useState } from 'react'
import GuitarChord from './guitar-chord'
import { ChordProgression } from '@/types/types'
import { Chord } from '@/types/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
    <div className="flex flex-row items-center rounded-xl p-4 hover:bg-secondary">
      <AlertDialog>
        <AlertDialogTrigger>
          <div className="flex-1 columns-4 p-4">
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
