import { FC } from 'react'

import GuitarProgViewer from '../guitar/guitar-prog'
import MidiVisualizer from '../midi/midi-visualizer'
import { Progression } from '@/types/types'
import PianoList from '@/components/piano/piano-list'
import MidiExportButton from '../midi/midi-export-button'
import { InstrumentTab } from './player-settings'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface InstrumentContainerProps {
  activeTab: InstrumentTab
  setActiveTab: (tab: InstrumentTab) => void
  index: number
  chordProgression: Progression
  indexCurrentChord: number
  isPlaying: (i: number) => boolean
  pitch: number
  tempo: number
  isCurrentlyPlaying: boolean
}

const InstrumentContainer: FC<InstrumentContainerProps> = (props) => {
  const { activeTab, setActiveTab, chordProgression, pitch, tempo } = props

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between gap-4 p-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InstrumentTab)}>
          <TabsList>
            <TabsTrigger value="midi">MIDI</TabsTrigger>
            <TabsTrigger value="guitar">Guitar</TabsTrigger>
            <TabsTrigger value="piano">Piano</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className={activeTab === 'midi' ? '' : 'invisible'}>
          <MidiExportButton
            chordProgression={chordProgression}
            pitch={pitch}
            tempo={tempo}
          />
        </div>
      </div>
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {activeTab === 'midi' && <MidiVisualizer {...props} />}
        {activeTab === 'guitar' && <GuitarProgViewer {...props} />}
        {activeTab === 'piano' && <PianoList {...props} />}
      </div>
    </div>
  )
}

export default InstrumentContainer
