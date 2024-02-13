'use client'

import { FC, useEffect, useRef } from 'react'
import { Piano as ReactPiano, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import './piano.css'
import { Chord } from '@/types/types'
import { convertToPitch } from '@/lib/utils'

export interface PianoViewerProps {
  chord: Chord
  pitch: number
  carousel: boolean
  playing: boolean
}

const Piano: FC<PianoViewerProps> = (props) => {
  const { chord, pitch, carousel, playing } = props

  const firstNote = MidiNumbers.fromNote('c' + pitch)
  const lastNote = MidiNumbers.fromNote('b' + (pitch + 1))

  const pianoRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (pianoRef.current) {
      console.log(pianoRef.current)
      console.log(pianoRef.current)
    }
  }, [pianoRef])

  return (
    <div className={`${carousel ? 'px-3 pb-3' : 'p-3'} text-sm text-muted-foreground gap-1`}>
      {!carousel && chord && chord.representation}
      <div className="pointer-events-none w-full">
        <ReactPiano
          ref={pianoRef}
          noteRange={{ first: firstNote, last: lastNote }}
          activeNotes={chord?.midi.map((midi) => convertToPitch(midi, pitch))}
          width={'full'}
          className={`${carousel ? 'carousel' : ''} ${playing ? 'playing' : ''}`}
          playNote={(midiNumber: number) => {}}
          stopNote={(midiNumber: number) => {}}
        />
      </div>
    </div>
  )
}

export default Piano
