import { FC, useState } from 'react'

import Piano from '../piano/piano'
import GuitarProgViewer from '../guitar/guitar-prog'
import MidiVisualizer from '../midi/midi-visualizer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progression } from '@/types/types'
import PianoList from '@/components/piano/piano-list'

import MidiExportButton from '../midi/midi-export-button'

export interface InstrumentContainerProps {
  index: number
  chordProgression: Progression
  indexCurrentChord: number
  isPlaying: (i: number) => boolean
  pitch: number
  tempo: number
  isCurrentlyPlaying: boolean
}

const InstrumentContainer: FC<InstrumentContainerProps> = (props) => {
  const { chordProgression, indexCurrentChord, pitch, tempo } = props
  return (
    <Tabs defaultValue="midi" className="w-full h-full flex flex-col">
      <div className="flex flex-row justify-between items-center h-14 px-3">
        <TabsList>
          <TabsTrigger value="midi">MIDI</TabsTrigger>
          <TabsTrigger value="guitar">Guitar</TabsTrigger>
          <TabsTrigger value="piano">Piano</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <MidiExportButton
            chordProgression={chordProgression}
            pitch={pitch}
            tempo={tempo}
          />
          {chordProgression.chords[indexCurrentChord] && (
            <Badge className="text-md">{chordProgression.chords[indexCurrentChord].representation}</Badge>
          )}
        </div>
      </div>
      <TabsContent value="guitar">
        <GuitarProgViewer {...props} />
      </TabsContent>
      <TabsContent value="piano" className="w-full">
        <PianoList {...props} />
      </TabsContent>
      <TabsContent value="midi" className="w-full flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-col">
        <MidiVisualizer {...props} />
      </TabsContent>
    </Tabs>
  )
}

export default InstrumentContainer
