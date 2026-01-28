import { FC } from 'react'

import GuitarProgViewer from '../guitar/guitar-prog'
import MidiVisualizer from '../midi/midi-visualizer'
import { Progression } from '@/types/types'
import { InstrumentTab } from './player-settings'

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
  const { activeTab, chordProgression, pitch, tempo } = props

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {activeTab === 'midi' && <MidiVisualizer {...props} />}
        {activeTab === 'guitar' && <GuitarProgViewer {...props} />}
      </div>
    </div>
  )
}

export default InstrumentContainer
