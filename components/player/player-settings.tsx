'use client'

import { FC } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/icons'

// list of instruments: https://surikov.github.io/midi-sounds-react-examples/examples/midi-sounds-example3/build/
export enum Instrument {
  piano = 12,
  guitar = 248,
  synth = 264,
}

export type InstrumentTab = 'midi' | 'guitar' | 'piano'

export const tabToInstrument: Record<InstrumentTab, keyof typeof Instrument> = {
  midi: 'synth',
  guitar: 'guitar',
  piano: 'piano',
}

export const MASTER_VOLUME = 0.05
export const DEFAULT_TEMPO = 120
export const DEFAULT_PITCH = 0

interface PlayerSettingsProps {
  activeTab: InstrumentTab
  tempo: number
  pitch: number
  setActiveTab: (tab: InstrumentTab) => void
  setTempo: (tempo: number) => void
  setPitch: (pitch: number) => void
}

const PlayerSettings: FC<PlayerSettingsProps> = (props) => {
  const { activeTab, tempo, pitch, setActiveTab, setTempo, setPitch } = props

  return (
    <div className="hidden md:flex flex-row items-center gap-4 p-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InstrumentTab)}>
        <TabsList className="gap-1 bg-transparent p-0">
          <TabsTrigger 
            value="midi" 
            className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
          >
            <Icons.music className="size-4" />
            <span className="instrument-tab-text">Synth</span>
          </TabsTrigger>
          <TabsTrigger 
            value="guitar" 
            className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
          >
            <Icons.guitar className="size-4" />
            <span className="instrument-tab-text">Guitar</span>
          </TabsTrigger>
          <TabsTrigger 
            value="piano" 
            className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
          >
            <Icons.piano className="size-4" />
            <span className="instrument-tab-text">Piano</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-1 flex-col gap-2 min-w-[120px]">
        <div className="flex items-center justify-between">
          <Label htmlFor="tempo">Tempo</Label>
          <span className="text-sm text-muted-foreground">{tempo} bpm</span>
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

      <div className="flex flex-1 flex-col gap-2 min-w-[120px]">
        <div className="flex items-center justify-between">
          <Label htmlFor="pitch">Pitch</Label>
          <span className="text-sm text-muted-foreground">{pitch > 0 ? `+${pitch}` : pitch}</span>
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
  )
}

export default PlayerSettings
