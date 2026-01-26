'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Progression } from '@/types/types'
// import Player from '@/components/player/player'
import { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, InstrumentTab, MASTER_VOLUME, tabToInstrument } from './player-settings'
import InstrumentContainer from './instrument-container'

import { convertToPitch } from '@/lib/utils'
import ChordIndicator from '@/components/list/chord-indicator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

interface PlayerContainerProps {
  progressions: Progression[]
}

const PlayerContainer: FC<PlayerContainerProps> = (props) => {
  const { progressions } = props

  // player settings
  const [activeTab, setActiveTab] = useState<InstrumentTab>('midi')
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)

  const instrumentKey = tabToInstrument[activeTab]

  // player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
  const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

  // Use any to avoid type issues with dynamic import if types are missing
  const player = useRef<any>(null)

  useEffect(() => {
    const initPlayer = async () => {
      const PlayerModule = (await import('@/components/player/player')).default
      player.current = new PlayerModule(instrumentValues, MASTER_VOLUME)
    }
    initPlayer()

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
    <div className="flex h-full flex-col gap-4 overflow-hidden border rounded-lg p-4">
      <ChordIndicator
        progressions={progressions}
        handlePlay={handlePlay}
        indexCurrentProgression={indexCurrentProgression}
        indexCurrentChord={indexCurrentChord}
      />

      {/* Instrument visualizer */}
      <div className="hidden bg-card md:flex flex-1 overflow-hidden rounded-xl min-h-0">
        <InstrumentContainer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          index={indexCurrentProgression}
          chordProgression={progressions[indexCurrentProgression]}
          indexCurrentChord={indexCurrentChord}
          isPlaying={isProgressionPlaying}
          pitch={pitch}
          tempo={tempo}
          isCurrentlyPlaying={isPlaying}
        />
      </div>

      <div className="hidden md:flex flex-shrink-0 items-center justify-between gap-4">

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIndexCurrentProgression((curr) => {
                let randomIndex
                do {
                  randomIndex = Math.floor(Math.random() * progressions.length)
                } while (randomIndex === curr && progressions.length > 1)
                playProgression(randomIndex)
                return randomIndex
              })
            }}
          >
            <Icons.random size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setIndexCurrentProgression((curr) => curr - 1 < 0 ? progressions.length - 1 : curr - 1)
            }
          >
            <Icons.skipBack size={18} />
          </Button>
          {isPlaying ? (
            <Button variant="ghost" size="icon" onClick={() => stopProgression()}>
              <Icons.pause size={18} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => playProgression(indexCurrentProgression)}>
              <Icons.play size={18} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setIndexCurrentProgression((curr) => curr + 1 === progressions.length ? 0 : curr + 1)
            }
          >
            <Icons.skipForward size={18} />
          </Button>
          <Button variant={loop ? 'default' : 'ghost'} size="icon" onClick={() => setLoop((l) => !l)}>
            <Icons.repeat size={17} />
          </Button>
        </div>

        {/* Tempo and Pitch */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2 w-40">
            <div className="flex items-center justify-between">
              <Label htmlFor="tempo" className="text-sm text-muted-foreground whitespace-nowrap">Tempo</Label>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{tempo} bpm</span>
            </div>
            <Slider
              id="tempo"
              max={300}
              min={5}
              defaultValue={[tempo]}
              step={1}
              onValueChange={(tempos) => setTempo(tempos[0])}
              aria-label="tempo"
            />
          </div>
          <div className="flex flex-col gap-2 w-40">
            <div className="flex items-center justify-between">
              <Label htmlFor="pitch" className="text-sm text-muted-foreground whitespace-nowrap">Pitch</Label>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{pitch > 0 ? `+${pitch}` : pitch}</span>
            </div>
            <Slider
              id="pitch"
              max={12}
              min={-12}
              defaultValue={[pitch]}
              step={1}
              onValueChange={(pitches) => setPitch(pitches[0])}
              aria-label="pitch"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerContainer
