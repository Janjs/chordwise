'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { ChordProgression } from '@/types/types'
import ChordProgItem from './list/chord-prog-item'
import MIDISounds, { MIDISoundsMethods } from 'midi-sounds-react'
import { Midi as TonalMidi, Chord as TonalChord } from 'tonal'
import PlayerSettings, { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, MASTER_VOLUME } from './player-settings'
import { Separator } from './ui/separator'
import { Icons } from './icons'
import InstrumentViewer from './instrument-viewer'

interface PlayerProps {
  chordProgressions: ChordProgression[]
}

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props

  // player settings
  const [instrumentKey, setInstrumentKey] = useState<keyof typeof Instrument>('piano')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)

  // player state
  const [playing, setPlaying] = useState(false)
  const [chordPlaying, setChordPlaying] = useState<number>(-1)
  const [indexChordPlaying, setIndexChordPlaying] = useState<number>(0)

  const getChordsPitches = (chordProgression: ChordProgression) =>
    chordProgression.chords.map((chord) => {
      const chordInfo = TonalChord.get(chord.representation)

      const notes =
        chordInfo.tonic != null
          ? TonalChord.getChord(chordInfo.type, chordInfo.tonic + pitch).notes
          : chordInfo.notes.map((note) => note + pitch)

      const pitches: number[] = notes.map((note) => TonalMidi.toMidi(note) as number).filter((note) => !!note)

      return pitches
    })

  const [chordProgressionPitches, setChordProgressionPitches] = useState<number[][]>(
    getChordsPitches(chordProgressions[indexChordPlaying]),
  )

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null)

  useEffect(() => {
    midiSoundsRef.current?.setMasterVolume(MASTER_VOLUME)
  }, [])

  const playChordProgression = async (indexChordProgression: number) => {
    const millisecondsPerBeat = 60000 / tempo // Calculate the duration of each beat in milliseconds
    const chordProgressionPlaying = chordProgressions[indexChordProgression]
    setChordProgressionPitches(getChordsPitches(chordProgressionPlaying))
    setChordPlaying(indexChordProgression)
    let i = 0

    const playNextChord = async () => {
      if (i < chordProgressionPitches.length) {
        const chordPitches = chordProgressionPitches[i]
        // Play each chord
        setChordPlaying(i)
        midiSoundsRef.current?.playChordNow(Instrument[instrumentKey], chordPitches, 1)

        i++
        setTimeout(playNextChord, millisecondsPerBeat)
      } else {
        setChordPlaying(-1)
        setPlaying(false)
      }
    }
    await playNextChord()
  }

  const handlePlay = (indexChordProgression: number) => {
    setPlaying(true)
    setIndexChordPlaying(indexChordProgression)
    playChordProgression(indexChordProgression)
  }

  const isChordProgPlaying = (i: number) => i === indexChordPlaying

  const instrumentValues: number[] = Object.values(Instrument)
    .filter((v) => typeof v === 'number')
    .map((value) => Number(value))
    .filter((v) => v!!)

  return (
    <div className="flex h-full flex-1 flex-col gap-5 md:flex-row">
      <ul className="custom-scrollbar flex-1 overflow-y-auto">
        {chordProgressions.map((chordProgression, index) => (
          <li key={index}>
            <ChordProgItem
              index={index}
              chordProgression={chordProgression}
              handlePlay={handlePlay}
              isPlaying={isChordProgPlaying}
              indexChordPlaying={chordPlaying}
            />
          </li>
        ))}
        <div className="hidden">
          <MIDISounds ref={midiSoundsRef} instruments={instrumentValues} />
        </div>
      </ul>

      <div className="hidden h-full flex-1 flex-col gap-5 md:flex">
        <div className="bg-card flex flex-1 flex-row overflow-auto rounded-xl p-5 pt-1">
          <InstrumentViewer
            guitarChordProgViewerProps={{
              index: indexChordPlaying,
              chordProgression: chordProgressions[indexChordPlaying],
              isPlaying: isChordProgPlaying,
              indexChordPlaying: chordPlaying,
            }}
            pianoViewerProps={{
              chordProgressionPitches,
              indexChordPlaying: chordPlaying,
              pitch: pitch,
            }}
          />
        </div>
        <div className="mb-5 mt-auto flex-none justify-self-end rounded-xl bg-card">
          <PlayerSettings
            instrumentKey={instrumentKey}
            tempo={tempo}
            pitch={pitch}
            setInstrumentKey={setInstrumentKey}
            setTempo={setTempo}
            setPitch={setPitch}
          />
          <Separator className="bg-background" />
          <div className="flex flex-1 flex-row items-center justify-around gap-5 p-5">
            <Icons.skipBack size={25} />
            {playing ? (
              <Icons.pause size={25} />
            ) : (
              <Icons.play
                size={25}
                onClick={() => {
                  playChordProgression(indexChordPlaying)
                  setPlaying(true)
                }}
              />
            )}
            <Icons.skipForward size={25} />
            <Icons.repeat size={25} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player
