'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Progression } from '@/types/types'
// import Player from '@/components/player/player'
import { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, InstrumentTab, MASTER_VOLUME, tabToInstrument } from './player-settings'

import { convertToPitch } from '@/lib/utils'
import ChordIndicator from '@/components/list/chord-indicator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import InstrumentContainer from './instrument-container'
import MidiExportButton from '@/components/midi/midi-export-button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'

interface PlayerContainerProps {
  progressions: Progression[]
  activeTab: InstrumentTab
  setActiveTab: (tab: InstrumentTab) => void
  tempo: number
  setTempo: (tempo: number) => void
  pitch: number
  setPitch: (pitch: number) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  indexCurrentProgression: number
  setIndexCurrentProgression: (index: number) => void
  indexCurrentChord: number
  setIndexCurrentChord: (index: number) => void
  isLoading?: boolean
}

const PlayerContainer: FC<PlayerContainerProps> = (props) => {
  const {
    progressions,
    activeTab,
    setActiveTab,
    tempo,
    setTempo,
    pitch,
    setPitch,
    isPlaying,
    setIsPlaying,
    indexCurrentProgression,
    setIndexCurrentProgression,
    indexCurrentChord,
    setIndexCurrentChord,
    isLoading = false,
  } = props

  const instrumentKey = tabToInstrument[activeTab]
  const isMobile = useIsMobile()

  const [loop, setLoop] = useState(false)

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

  const emptyProgression: Progression = { chords: [] }

  return (
    <div className={`flex h-full flex-col gap-4 overflow-hidden rounded-lg p-4 ${isMobile ? '' : 'border'}`}>
      <div className="flex items-center justify-between gap-4">
        {isMobile && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InstrumentTab)}>
            <TabsList className="gap-1 bg-muted/50 p-1 h-9">
              <TabsTrigger
                value="midi"
                className="rounded-md px-2 py-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icons.piano className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="guitar"
                className="rounded-md px-2 py-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icons.guitar className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {(isLoading || progressions.length === 0) ? (
          <div className="flex flex-none items-center">
            <Button
              variant="outline"
              disabled
              className="px-2 opacity-50 cursor-not-allowed"
            >
              <Badge
                variant="outline"
                className="rounded-md px-1 py-1 opacity-50 text-muted-foreground border-0"
              >
                No chord progressions generated yet
              </Badge>
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <ChordIndicator
              progressions={progressions}
              handlePlay={handlePlay}
              indexCurrentProgression={indexCurrentProgression}
              indexCurrentChord={indexCurrentChord}
            />
          </div>
        )}
      </div>

      <div className="bg-card flex flex-1 overflow-hidden rounded-xl min-h-0">
        <InstrumentContainer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          index={indexCurrentProgression}
          chordProgression={(isLoading || progressions.length === 0) ? emptyProgression : progressions[indexCurrentProgression]}
          indexCurrentChord={indexCurrentChord}
          isPlaying={isProgressionPlaying}
          pitch={pitch}
          tempo={tempo}
          isCurrentlyPlaying={isPlaying}
        />
      </div>

      <div className="flex flex-shrink-0 items-center gap-4 relative">
        {/* Settings Popover - Left */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icons.settings size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-2">
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
          </PopoverContent>
        </Popover>

        {/* Playback controls - Middle (centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setIndexCurrentProgression(indexCurrentProgression - 1 < 0 ? progressions.length - 1 : indexCurrentProgression - 1)
            }
            disabled={isLoading || progressions.length === 0}
          >
            <Icons.skipBack size={18} />
          </Button>
          {isPlaying ? (
            <Button variant="ghost" size="icon" onClick={() => stopProgression()} disabled={isLoading}>
              <Icons.pause size={18} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => playProgression(indexCurrentProgression)} disabled={isLoading || progressions.length === 0}>
              <Icons.play size={18} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setIndexCurrentProgression(indexCurrentProgression + 1 === progressions.length ? 0 : indexCurrentProgression + 1)
            }
            disabled={isLoading || progressions.length === 0}
          >
            <Icons.skipForward size={18} />
          </Button>
          <Button variant={loop ? 'default' : 'ghost'} size="icon" onClick={() => setLoop((l) => !l)} disabled={isLoading || progressions.length === 0}>
            <Icons.repeat size={17} />
          </Button>
        </div>

        {/* Export MIDI - Right */}
        <div className="ml-auto">
          <MidiExportButton
            chordProgression={isLoading ? emptyProgression : progressions[indexCurrentProgression]}
            pitch={pitch}
            tempo={tempo}
            disabled={isLoading || progressions.length === 0}
            iconOnly={isMobile}
          />
        </div>
      </div>
    </div>
  )
}

export default PlayerContainer
