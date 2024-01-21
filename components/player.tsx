'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Progression } from '@/types/types'
import ProgressionItem from './list/progression-item'
import MIDISounds, { MIDISoundsMethods } from 'midi-sounds-react'
import PlayerSettings, { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, MASTER_VOLUME } from './player-settings'
import { Separator } from './ui/separator'
import { Icons } from './icons'
import InstrumentViewer from './instrument-viewer'
import { convertToPitch } from '@/lib/utils'

interface PlayerProps {
  progressions: Progression[]
}

const Player: FC<PlayerProps> = (props) => {
  const { progressions } = props

  // player settings
  const [instrumentKey, setInstrumentKey] = useState<keyof typeof Instrument>('piano')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)

  // player state
  const [playing, setPlaying] = useState(false)
  const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
  const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null)

  useEffect(() => {
    midiSoundsRef.current?.setMasterVolume(MASTER_VOLUME)
  }, [])

  const playProgression = async (indexChordProgression: number) => {
    setPlaying(true)
    setIndexCurrentChord(indexChordProgression)

    const millisecondsPerBeat = 60000 / tempo // Calculate the duration of each beat in milliseconds
    const progressionPlaying = progressions[indexChordProgression]

    let i = 0

    const playNextChord = async () => {
      if (i < progressionPlaying.chords.length) {
        const midi = progressionPlaying.chords[i].midi.map((midi) => convertToPitch(midi, pitch))

        // Play each chord
        setIndexCurrentChord(i)
        midiSoundsRef.current?.playChordNow(Instrument[instrumentKey], midi, 1)

        i++
        setTimeout(playNextChord, millisecondsPerBeat)
      } else {
        setIndexCurrentChord(-1)
        setPlaying(false)
      }
    }
    await playNextChord()
  }

  const handlePlay = (indexChordProgression: number) => {
    setIndexCurrentProgression(indexChordProgression)
    playProgression(indexChordProgression)
  }

  const isProgressionPlaying = (i: number) => i === indexCurrentProgression

  const instrumentValues: number[] = Object.values(Instrument)
    .filter((v) => typeof v === 'number')
    .map((value) => Number(value))
    .filter((v) => v!!)

  return (
    <div className="flex h-full flex-1 flex-col gap-5 md:flex-row">
      <ul className="custom-scrollbar flex-1 overflow-y-auto">
        {progressions.map((progression, index) => (
          <li key={index}>
            <ProgressionItem
              index={index}
              progression={progression}
              handlePlay={handlePlay}
              isPlaying={isProgressionPlaying}
              indexChordPlaying={indexCurrentChord}
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
              index: indexCurrentProgression,
              chordProgression: progressions[indexCurrentProgression],
              isPlaying: isProgressionPlaying,
              indexChordPlaying: indexCurrentChord,
            }}
            pianoViewerProps={{
              chord: progressions[indexCurrentProgression].chords[indexCurrentChord],
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
              <Icons.play size={25} onClick={() => playProgression(indexCurrentProgression)} />
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
