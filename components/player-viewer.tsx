import { FC, useState } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import GuitarChordProgViewer, { GuitarChordProgViewerProps } from './guitar/guitar-chord-prog'
import Piano from './piano/piano'

interface PlayerViewerProps<GuitarChordProgViewerProps> {
  guitarChordProgViewerProps: GuitarChordProgViewerProps
}

const PlayerViewer: FC<PlayerViewerProps<GuitarChordProgViewerProps>> = ({ guitarChordProgViewerProps }) => {
  const [openItems, setOpenItems] = useState<string[]>([])

  function handleItemClick(id: string) {
    setOpenItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  return (
    <div className="flex-1 rounded-xl p-5 flex flex-row bg-card">
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
              <Piano />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default PlayerViewer
