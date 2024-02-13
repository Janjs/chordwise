'use client'

import { FC } from 'react'
import GuitarChord from './guitar-chord'
import { Progression } from '@/types/types'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

export interface GuitarProgViewerProps {
  index: number
  chordProgression: Progression
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const GuitarProgViewer: FC<GuitarProgViewerProps> = (props) => {
  const { index, chordProgression, isPlaying, indexChordPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  return (
    <>
      <Carousel plugins={[WheelGesturesPlugin()]}>
        <CarouselContent>
          {chordProgression.chords.map((chord, i) => (
            <CarouselItem>
              <GuitarChord key={i} chord={chord} dialog={false} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </>
  )
}

export default GuitarProgViewer
