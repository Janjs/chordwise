'use client'

import { FC } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

// list of instruments: https://surikov.github.io/midi-sounds-react-examples/examples/midi-sounds-example3/build/
export enum Instrument {
  piano = 12,
  guitar = 248,
  flute = 771,
}

export const MASTER_VOLUME = 0.05
export const DEFAULT_TEMPO = 120
export const DEFAULT_PITCH = 3

interface PlayerSettingsProps {
  instrumentKey: keyof typeof Instrument
  tempo: number
  pitch: number
  setInstrumentKey: (instrumentKey: keyof typeof Instrument) => void
  setTempo: (tempo: number) => void
  setPitch: (pitch: number) => void
}

const PlayerSettings: FC<PlayerSettingsProps> = (props) => {
  const { instrumentKey, tempo, pitch, setInstrumentKey, setTempo, setPitch } = props

  return (
    <div className="hidden md:flex flex-1 flex-row justify-between gap-4 p-4">
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Select onValueChange={(d) => setInstrumentKey(d as keyof typeof Instrument)} defaultValue={instrumentKey}>
          <SelectTrigger className="outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Instruments</SelectLabel>
              <SelectItem value="piano">🎹 Piano</SelectItem>
              <SelectItem value="guitar">🎸 Guitar</SelectItem>
              <SelectItem value="flute">🪈 Flute</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="top-p">Tempo</Label>
          <p className="text-right text-sm text-muted-foreground">{tempo} bpm</p>
        </div>
        <Slider
          id="tempo"
          max={300}
          min={5}
          defaultValue={[tempo]}
          step={1}
          onValueChange={(tempos) => setTempo(tempos[0])}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          aria-label="tempo"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="pitch">Pitch</Label>
          <span className="text-right text-sm text-muted-foreground">{pitch}</span>
        </div>
        <Slider
          id="pitch"
          max={8}
          min={1}
          defaultValue={[pitch]}
          step={1}
          onValueChange={(pitches) => setPitch(pitches[0])}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          aria-label="pitch"
        />
      </div>
    </div>
  )
}

export default PlayerSettings
