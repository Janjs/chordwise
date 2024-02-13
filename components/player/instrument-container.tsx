import { FC, useState } from 'react'

import Piano from '../piano/piano'
import GuitarProgViewer from '../guitar/guitar-prog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progression } from '@/types/types'
import PianoList from '@/components/piano/piano-list'

export interface InstrumentContainerProps {
  index: number
  chordProgression: Progression
  indexCurrentChord: number
  isPlaying: (i: number) => boolean
  pitch: number
}

const InstrumentContainer: FC<InstrumentContainerProps> = (props) => {
  const { chordProgression, indexCurrentChord } = props
  return (
    <Tabs defaultValue="guitar" className="w-full">
      <div className="flex flex-row justify-between h-14">
        <TabsList className="p-3 mt-3">
          <TabsTrigger value="guitar">Guitar</TabsTrigger>
          <TabsTrigger value="piano">Piano</TabsTrigger>
        </TabsList>
        {chordProgression.chords[indexCurrentChord] && (
          <Badge className="m-3 text-md">{chordProgression.chords[indexCurrentChord].representation}</Badge>
        )}
      </div>
      <TabsContent value="guitar">
        <GuitarProgViewer {...props} />
      </TabsContent>
      <TabsContent value="piano" className="w-full">
        <PianoList {...props} />
      </TabsContent>
    </Tabs>
  )
}

export default InstrumentContainer
