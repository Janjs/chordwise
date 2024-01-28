'use client'

import { FC, useRef, useState } from 'react'
import GuitarChord from './guitar-chord'
import { Progression } from '@/types/types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export interface GuitarProgViewerProps {
  index: number
  chordProgression: Progression
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const GuitarProgViewer: FC<GuitarProgViewerProps> = (props) => {
  const { index, chordProgression, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <div className="grid grid-cols-4 gap-4 rounded-sm hover:bg-secondary">
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
  )
}

export default GuitarProgViewer
