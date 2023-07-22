'use client'

import { FC, useRef, useState } from 'react'
import { ChordProgression } from '@/types/types'
import ChordProgressionViewer from './chord-prog-viewer'
import MIDISounds, { MIDISoundsMethods } from 'midi-sounds-react'
import { Midi, Chord } from 'tonal'
import PlayerSettings, { Instrument } from './player-settings'

interface PlayerProps {
  chordProgressions: ChordProgression[]
}

const PITCH = '4'

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props

  const [chordPlaying, setChordPlaying] = useState<number>(-1)
  const [indexCurrentPlaying, setIndexChordPlaying] =
    useState<number>(0)

  // player settings
  const [instrumentKey, setInstrumentKey] =
    useState<keyof typeof Instrument>('piano')
  const [tempo, setTempo] = useState<number>(120)
  const [pitch, setPitch] = useState<number>(5)

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null)

  const getChordsPitches = (chordProgression: ChordProgression) => {
    return chordProgression.chords.map((chord) => {
      const notes = Chord.get(chord).notes

      const pitches: number[] = notes
        .map((note) => Midi.toMidi(note + pitch) as number)
        .filter((note) => !!note)

      return pitches
    })
  }

  const playChordProgression = (indexChordProgression: number) => {
    const millisecondsPerBeat = 60000 / tempo // Calculate the duration of each beat in milliseconds
    const chordProgressionPlaying =
      chordProgressions[indexChordProgression]
    const chordProgressionPitches = getChordsPitches(
      chordProgressionPlaying
    )
    setChordPlaying(indexChordProgression)
    let i = 0

    const playNextChord = () => {
      if (i < chordProgressionPitches.length) {
        const chordPitches = chordProgressionPitches[i]
        // Play each chord
        setChordPlaying(i)
        midiSoundsRef.current?.playChordNow(
          Instrument[instrumentKey],
          chordPitches,
          1
        )

        i++
        setTimeout(playNextChord, millisecondsPerBeat)
      } else {
        setChordPlaying(-1)
      }
    }
    playNextChord()
  }

  const handlePlay = (indexChordProgression: number) => {
    setIndexChordPlaying(indexChordProgression)
    playChordProgression(indexChordProgression)
  }

  const isPlaying = (i: number) => i === indexCurrentPlaying

  const instrumentValues: number[] = Object.values(Instrument)
    .filter((v) => typeof v === 'number')
    .map((value) => Number(value))
    .filter((v) => v!!)

  return (
    <div className='flex flex-column gap-5'>
      <PlayerSettings
        instrumentKey={instrumentKey}
        tempo={tempo}
        pitch={pitch}
        setInstrumentKey={setInstrumentKey}
        setTempo={setTempo}
        setPitch={setPitch}
      />
      <ul className='flex-1'>
        {chordProgressions.map((chordProgression, index) => (
          <li key={index}>
            <ChordProgressionViewer
              index={index}
              chordProgression={chordProgression.chords}
              handlePlay={handlePlay}
              isPlaying={isPlaying}
              indexChordPlaying={chordPlaying}
            />
          </li>
        ))}
        <div className='hidden'>
          <MIDISounds
            ref={midiSoundsRef}
            instruments={instrumentValues}
          />
        </div>
      </ul>
    </div>
  )
}

export default Player
