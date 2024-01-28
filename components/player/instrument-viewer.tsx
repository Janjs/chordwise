import { FC, useState } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Piano, { PianoViewerProps } from '../piano/piano'
import GuitarProgViewer, { GuitarProgViewerProps } from '../guitar/guitar-prog'

interface InstrumentViewerProps<GuitarChordProgViewerProps, PianoViewerProps> {
  guitarChordProgViewerProps: GuitarChordProgViewerProps
  pianoViewerProps: PianoViewerProps
}

const InstrumentViewer: FC<InstrumentViewerProps<GuitarProgViewerProps, PianoViewerProps>> = ({
  guitarChordProgViewerProps,
  pianoViewerProps,
}) => {
  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={['guitar', 'piano']}>
        <AccordionItem value="piano">
          <AccordionTrigger>Piano</AccordionTrigger>
          <AccordionContent>
            <Piano {...pianoViewerProps} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="guitar">
          <AccordionTrigger>Guitar</AccordionTrigger>
          <AccordionContent>
            <GuitarProgViewer {...guitarChordProgViewerProps} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default InstrumentViewer
