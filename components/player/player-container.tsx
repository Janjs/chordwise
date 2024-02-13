'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Progression } from '@/types/types'
import Player from '@/components/player/player'
import PlayerSettings, { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, MASTER_VOLUME } from './player-settings'
import { Separator } from '@/components/ui/separator'
import InstrumentContainer from './instrument-container'

import { convertToPitch } from '@/lib/utils'
import PlayerControls from './player-controls'
import ProgressionList from '@/components/list/progression-list'

interface PlayerContainerProps {
  progressions: Progression[]
}

const PlayerContainer: FC<PlayerContainerProps> = (props) => {
  const { progressions } = props

  // player settings
  const [instrumentKey, setInstrumentKey] = useState<keyof typeof Instrument>('piano')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)

  // player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
  const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

  const player = useRef<Player | null>(null)

  useEffect(() => {
    player.current = new Player(instrumentValues, MASTER_VOLUME)
    return () => {
      if (player.current) {
        player.current?.stopPlay()
      }
    }
  }, [])

  const playProgression = (indexChordProgression: number) => {
    if (player.current) {
      player.current?.resume()
      setIsPlaying(true)
      const progression = progressions[indexChordProgression]
      const beats = progression.chords.map((chord) => [
        [Instrument[instrumentKey], chord.midi.map((midi) => convertToPitch(midi, pitch)), 1],
      ])
      player.current?.startPlay(
        beats,
        tempo,
        1,
        indexCurrentChord == -1 || !loop ? 0 : indexCurrentChord,
        loop,
        setIndexCurrentChord,
        setIsPlaying,
      )
    }
  }

  const stopProgression = () => {
    if (player.current) {
      setIsPlaying(false)
      if (!loop) setIndexCurrentChord(-1)
      player.current?.stopPlay()
    }
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
    <div className="flex h-full flex-1 flex-col gap-4 md:flex-row">
      <ProgressionList
        progressions={progressions}
        handlePlay={handlePlay}
        indexCurrentProgression={indexCurrentProgression}
        indexCurrentChord={indexCurrentChord}
      />

      <div className="flex-none md:h-full md:flex-1 flex-col gap-4 md:flex">
        <div className="hidden bg-card md:flex flex-1 flex-row overflow-auto rounded-xl p-5 pt-1">
          <InstrumentContainer
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
        <div className="mb-4 mt-auto flex-none justify-self-end rounded-xl bg-card">
          <PlayerSettings
            instrumentKey={instrumentKey}
            tempo={tempo}
            pitch={pitch}
            setInstrumentKey={setInstrumentKey}
            setTempo={setTempo}
            setPitch={setPitch}
          />
          <Separator className="bg-background" />
          <PlayerControls
            progressionsLength={progressions.length}
            indexCurrentProgression={indexCurrentProgression}
            isPlaying={isPlaying}
            loop={loop}
            setLoop={setLoop}
            setIndexCurrentProgression={setIndexCurrentProgression}
            stopProgression={stopProgression}
            playProgression={playProgression}
          />
        </div>
      </div>
    </div>
  )
}

export default PlayerContainer
