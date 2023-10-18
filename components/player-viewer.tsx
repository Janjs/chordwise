import { FC, useState } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import GuitarChordProgViewer, { GuitarChordProgViewerProps } from './guitar/guitar-chord-prog'
import Piano, { PianoViewerProps } from './piano/piano'

interface PlayerViewerProps<GuitarChordProgViewerProps, PianoViewerProps> {
  guitarChordProgViewerProps: GuitarChordProgViewerProps
  pianoViewerProps: PianoViewerProps
}

const PlayerViewer: FC<PlayerViewerProps<GuitarChordProgViewerProps, PianoViewerProps>> = ({
  guitarChordProgViewerProps,
  pianoViewerProps,
}) => {
  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={['guitar', 'piano']}>
        <AccordionItem value="guitar">
          <AccordionTrigger>Guitar</AccordionTrigger>
          <AccordionContent>
            <GuitarChordProgViewer {...guitarChordProgViewerProps} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="piano">
          <AccordionTrigger>Piano</AccordionTrigger>
          <AccordionContent>
            <Piano {...pianoViewerProps} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default PlayerViewer
