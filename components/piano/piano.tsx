'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Piano as ReactPiano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import './piano.css'

export interface PianoViewerProps {
  chordProgressionPitches: number[][]
  indexChordPlaying: number
  pitch: number[]
}

const Piano: FC<PianoViewerProps> = (props) => {
  const { chordProgressionPitches, indexChordPlaying, pitch } = props

  const firstNote = MidiNumbers.fromNote('c' + pitch[0])
  const lastNote = MidiNumbers.fromNote('b' + (pitch[0] + 1))

  useEffect(() => {
    console.log('firstNote: ', firstNote)
    console.log('lastNote: ', lastNote)
  }, [chordProgressionPitches])

  return (
    <div className="pointer-events-none">
      <ReactPiano
        noteRange={{ first: firstNote, last: lastNote }}
        activeNotes={chordProgressionPitches[indexChordPlaying]}
        width={'auto'}
        playNote={(midiNumber: number) => {}}
        stopNote={(midiNumber: number) => {}}
      />
    </div>
  )
}

export default Piano
