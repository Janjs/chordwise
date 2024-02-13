'use client'

import { FC } from 'react'
import { Piano as ReactPiano, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import './piano.css'
import { Chord } from '@/types/types'
import { convertToPitch } from '@/lib/utils'

export interface PianoViewerProps {
  chord: Chord
  pitch: number
}

const Piano: FC<PianoViewerProps> = (props) => {
  const { chord, pitch } = props

  const firstNote = MidiNumbers.fromNote('c' + pitch)
  const lastNote = MidiNumbers.fromNote('b' + (pitch + 1))

  return (
    <div className="pointer-events-none w-full">
      <ReactPiano
        noteRange={{ first: firstNote, last: lastNote }}
        activeNotes={chord?.midi.map((midi) => convertToPitch(midi, pitch))}
        width={'auto'}
        playNote={(midiNumber: number) => {}}
        stopNote={(midiNumber: number) => {}}
      />
    </div>
  )
}

export default Piano
