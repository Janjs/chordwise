import { FC, useState } from 'react'

import Piano, { PianoViewerProps } from '../piano/piano'
import GuitarProgViewer, { GuitarProgViewerProps } from '../guitar/guitar-prog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface InstrumentContainerProps<GuitarChordProgViewerProps, PianoViewerProps> {
  guitarChordProgViewerProps: GuitarChordProgViewerProps
  pianoViewerProps: PianoViewerProps
}

const InstrumentContainer: FC<InstrumentContainerProps<GuitarProgViewerProps, PianoViewerProps>> = ({
  guitarChordProgViewerProps,
  pianoViewerProps,
}) => {
  return (
    <Tabs defaultValue="guitar" className="w-full">
      <TabsList className="p-3 mt-3">
        <TabsTrigger value="guitar">Guitar</TabsTrigger>
        <TabsTrigger value="piano">Piano</TabsTrigger>
      </TabsList>
      <TabsContent value="guitar">
        <GuitarProgViewer {...guitarChordProgViewerProps} />
      </TabsContent>
      <TabsContent value="piano" className="w-full">
        <Piano {...pianoViewerProps} />
      </TabsContent>
    </Tabs>
  )
}

export default InstrumentContainer
