import { FC, useState } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import GuitarChordProgViewer, { GuitarChordProgViewerProps } from './guitar/guitar-chord-prog'
import Piano from './piano/piano'

interface PlayerViewerProps<GuitarChordProgViewerProps> {
  guitarChordProgViewerProps: GuitarChordProgViewerProps
}

const PlayerViewer: FC<PlayerViewerProps<GuitarChordProgViewerProps>> = ({ guitarChordProgViewerProps }) => {
  const [openItems, setOpenItems] = useState<string[]>()

  const handleValueChange = (value: string) => {
    setOpenItems((prev) => {
      if (prev!!.includes(value)) {
        // If the item is already open, close it
        return prev.filter((item) => item !== value)
      } else {
        // Otherwise, add the item to the open items
        return [...prev, value]
      }
    })
  }

  return (
    <div className="flex-1 rounded-xl p-5 flex flex-row bg-card">
      <div className="w-full">
        <Accordion type="single" defaultValue="guitar" collapsible>
          <AccordionItem value="guitar">
            <AccordionTrigger>Guitar</AccordionTrigger>
            <AccordionContent>
              <GuitarChordProgViewer {...guitarChordProgViewerProps} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="piano">
            <AccordionTrigger>Piano</AccordionTrigger>
            <AccordionContent>
              <Piano />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default PlayerViewer
