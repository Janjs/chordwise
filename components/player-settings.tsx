import { FC, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import * as z from 'zod'
import { Slider } from './ui/slider'

// list of instruments: https://surikov.github.io/midi-sounds-react-examples/examples/midi-sounds-example3/build/
export enum Instrument {
  piano = 4,
  guitar = 260,
  flute = 771,
}

interface PlayerSettingsProps {
  instrumentKey: keyof typeof Instrument
  tempo: number[]
  pitch: number[]
  setInstrumentKey: (instrumentKey: keyof typeof Instrument) => void
  setTempo: (tempo: number[]) => void
  setPitch: (pitch: number[]) => void
}

const PlayerSettings: FC<PlayerSettingsProps> = (props) => {
  const {
    instrumentKey,
    tempo,
    pitch,
    setInstrumentKey,
    setTempo,
    setPitch,
  } = props

  return (
    <div className='w-40 flex flex-col gap-5'>
      <div className='flex flex-col gap-2'>
        <Label>Instrument</Label>
        <Select
          onValueChange={(d) =>
            setInstrumentKey(d as keyof typeof Instrument)
          }
          defaultValue={instrumentKey}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Instruments</SelectLabel>
              <SelectItem value='piano'>🎹 Piano</SelectItem>
              <SelectItem value='guitar'>🎸 Guitar</SelectItem>
              <SelectItem value='flute'>🪈 Flute</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='top-p'>Tempo</Label>
          <span className='w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground'>
            {tempo}
          </span>
        </div>
        <Slider
          id='tempo'
          max={300}
          min={5}
          defaultValue={tempo}
          step={1}
          onValueChange={setTempo}
          className='[&_[role=slider]]:h-4 [&_[role=slider]]:w-4'
          aria-label='tempo'
        />
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='pitch'>Pitch</Label>
          <span className='w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground'>
            {pitch}
          </span>
        </div>
        <Slider
          id='pitch'
          max={8}
          min={1}
          defaultValue={pitch}
          step={1}
          onValueChange={setPitch}
          className='[&_[role=slider]]:h-4 [&_[role=slider]]:w-4'
          aria-label='pitch'
        />
      </div>
    </div>
  )
}

export default PlayerSettings
