'use client'

import { FC, useEffect, useState } from 'react'
import GuitarChord from './guitar-chord'
import { Progression } from '@/types/types'

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Separator } from '@/components/ui/separator'
import { InstrumentContainerProps } from '../player/instrument-container'

const GuitarProgViewer: FC<InstrumentContainerProps> = (props) => {
  const { index, chordProgression, indexCurrentChord, isPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexCurrentChord === chord

  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }

    api.scrollTo(indexCurrentChord)
  }, [api, indexCurrentChord])

  return (
    <>
      <Carousel plugins={[WheelGesturesPlugin()]} setApi={setApi}>
        <CarouselContent>
          {chordProgression.chords.map((chord, i) => (
            <CarouselItem>
              <GuitarChord key={i} chord={chord} current={true} carousel={true} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <Separator className="bg-background" />
      <ul className="grid grid-cols-4 p-3">
        {chordProgression.chords.map((chord, i) => (
          <GuitarChord key={i} chord={chord} current={isChordPlaying(i)} carousel={false} />
        ))}
      </ul>
    </>
  )
}

export default GuitarProgViewer
