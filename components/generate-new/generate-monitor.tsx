'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Progression } from '@/types/types'
import PlayerSettings, { DEFAULT_PITCH, DEFAULT_TEMPO, Instrument, MASTER_VOLUME } from '../player/player-settings'
import { Separator } from '@/components/ui/separator'
import InstrumentContainer from '../player/instrument-container'
import { convertToPitch } from '@/lib/utils'
import PlayerControls from '../player/player-controls'
import { Skeleton } from '@/components/ui/skeleton'

interface GenerateMonitorProps {
    progressions: Progression[]
    isLoading: boolean
    error: string | null
}

export const GenerateMonitor: FC<GenerateMonitorProps> = ({ progressions, isLoading, error }) => {
    // player settings
    const [instrumentKey, setInstrumentKey] = useState<keyof typeof Instrument>('piano')
    const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO)
    const [pitch, setPitch] = useState<number>(DEFAULT_PITCH)

    // player state
    const [isPlaying, setIsPlaying] = useState(false)
    const [loop, setLoop] = useState(false)
    const [indexCurrentProgression, setIndexCurrentProgression] = useState<number>(0)
    const [indexCurrentChord, setIndexCurrentChord] = useState<number>(-1)

    // Use any to avoid type issues with dynamic import if types are missing
    const player = useRef<any>(null)

    const instrumentValues: number[] = Object.values(Instrument)
        .filter((v) => typeof v === 'number')
        .map((value) => Number(value))
        .filter((v) => v!!)

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

    // Reset indices when progressions change
    useEffect(() => {
        if (progressions.length > 0) {
            setIndexCurrentProgression(0)
        }
    }, [progressions])

    const playProgression = (indexChordProgression: number) => {
        if (player.current && progressions[indexChordProgression]) {
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

    const isProgressionPlaying = (i: number) => i === indexCurrentProgression

    if (isLoading) {
        return (
            <div className="h-full w-full p-6 flex flex-col gap-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="flex-1 w-full rounded-xl" />
                <div className="h-32 flex gap-4">
                    <Skeleton className="flex-1 rounded-xl" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center p-6 text-destructive">
                Error: {error}
            </div>
        )
    }

    if (progressions.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center p-6 text-muted-foreground">
                Enter a description and click Generate to see chords here.
            </div>
        )
    }

    const currentProgression = progressions[indexCurrentProgression]

    return (
        <div className="flex h-full flex-col p-6 gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">The Generated Chords</h2>
                {progressions.length > 1 && (
                    <span className="text-sm text-muted-foreground">
                        Variation {indexCurrentProgression + 1} of {progressions.length}
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 bg-card rounded-xl overflow-hidden border shadow-sm">
                <InstrumentContainer
                    index={indexCurrentProgression}
                    chordProgression={currentProgression}
                    indexCurrentChord={indexCurrentChord}
                    isPlaying={isProgressionPlaying}
                    pitch={pitch}
                    tempo={tempo}
                    isCurrentlyPlaying={isPlaying}
                />
            </div>

            <div className="flex-none bg-card rounded-xl border shadow-sm p-2 flex flex-col gap-2">
                {/* Controls Layout trying to match sketch bottom section */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <PlayerSettings
                            instrumentKey={instrumentKey}
                            tempo={tempo}
                            pitch={pitch}
                            setInstrumentKey={setInstrumentKey}
                            setTempo={setTempo}
                            setPitch={setPitch}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-12 hidden md:block" />
                    <Separator orientation="horizontal" className="w-full md:hidden" />

                    <div className="flex-none px-4">
                        <PlayerControls
                            progressionsLength={progressions.length}
                            indexCurrentProgression={indexCurrentProgression}
                            isPlaying={isPlaying}
                            loop={loop}
                            setLoop={setLoop}
                            setIndexCurrentProgression={(val) => {
                                stopProgression()
                                setIndexCurrentProgression(val)
                            }}
                            stopProgression={stopProgression}
                            playProgression={playProgression}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
