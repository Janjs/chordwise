'use client'

import { FC, useRef, useState } from 'react'
import { ChordProgression } from '@/types/types'
import ChordProgItem from './list/chord-prog-item'
import MIDISounds, { MIDISoundsMethods } from 'midi-sounds-react'
// TODO: Check compatibility to chords from guitar chord
import { Midi, Chord } from 'tonal'
import PlayerSettings, { Instrument } from './player-settings'
import { Separator } from './ui/separator'
import { Icons } from './icons'
import { Progress } from './ui/progress'
import GuitarChordProg from './guitar/guitar-chord-prog'

interface PlayerProps {
  chordProgressions: ChordProgression[]
}

const DEFAULT_TEMPO = 120
const DEFAULT_PITCH = 5

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props

  const [chordPlaying, setChordPlaying] = useState<number>(-1)
  const [indexCurrentPlaying, setIndexChordPlaying] = useState<number>(0)

  // player settings
  const [instrumentKey, setInstrumentKey] = useState<keyof typeof Instrument>('piano')
  const [tempo, setTempo] = useState<number[]>([DEFAULT_TEMPO])
  const [pitch, setPitch] = useState<number[]>([DEFAULT_PITCH])

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null)

  const getChordsPitches = (chordProgression: ChordProgression) => {
    return chordProgression.chords.map((chord) => {
      const notes = Chord.get(chord.representation).notes

      const pitches: number[] = notes.map((note) => Midi.toMidi(note + pitch[0]) as number).filter((note) => !!note)

      return pitches
    })
  }

  const playChordProgression = (indexChordProgression: number) => {
    const millisecondsPerBeat = 60000 / tempo[0] // Calculate the duration of each beat in milliseconds
    const chordProgressionPlaying = chordProgressions[indexChordProgression]
    const chordProgressionPitches = getChordsPitches(chordProgressionPlaying)
    setChordPlaying(indexChordProgression)
    let i = 0

    const playNextChord = () => {
      if (i < chordProgressionPitches.length) {
        const chordPitches = chordProgressionPitches[i]
        // Play each chord
        setChordPlaying(i)
        midiSoundsRef.current?.playChordNow(Instrument[instrumentKey], chordPitches, 1)

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
    <div className="flex-1 flex h-full flex-row gap-5">
      <ul className="flex-1 overflow-auto">
        {chordProgressions.map((chordProgression, index) => (
          <li key={index}>
            <ChordProgItem
              index={index}
              chordProgression={chordProgression}
              handlePlay={handlePlay}
              isPlaying={isPlaying}
              indexChordPlaying={chordPlaying}
            />
          </li>
        ))}
      </ul>

      <div className="hidden">
        <MIDISounds ref={midiSoundsRef} instruments={instrumentValues} />
      </div>

      <div className="flex-1 gap-5 flex flex-col">
        <div className="flex-1 bg-card rounded-xl h-full p-4">
          <GuitarChordProg
            index={indexCurrentPlaying}
            chordProgression={chordProgressions[indexCurrentPlaying]}
            isPlaying={isPlaying}
            indexChordPlaying={chordPlaying}
          />
        </div>
        <div className="flex-none bg-card rounded-xl">
          <PlayerSettings
            instrumentKey={instrumentKey}
            tempo={tempo}
            pitch={pitch}
            setInstrumentKey={setInstrumentKey}
            setTempo={setTempo}
            setPitch={setPitch}
          />
          <Separator className="bg-background" />
          <div className="flex-1 flex flex-row gap-5 justify-between items-center p-5">
            <Icons.skipBack size={35} />
            <Icons.play size={35} />
            <Icons.skipForward size={35} />
            <Progress value={33} />
            <Icons.repeat size={35} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player
