'use client'

import { FC, useEffect, useRef, useState } from 'react'
import GuitarChord from './guitar-chord'
import { Progression } from '@/types/types'

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Separator } from '@/components/ui/separator'

export interface GuitarProgViewerProps {
  index: number
  chordProgression: Progression
  indexCurrentChord: number
  isPlaying: (i: number) => boolean
}

const GuitarProgViewer: FC<GuitarProgViewerProps> = (props) => {
  const { index, chordProgression, indexCurrentChord, isPlaying } = props

  const isChordPlaying = (chord: number) => isPlaying(index) && indexCurrentChord === chord

  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }

    api.scrollTo(indexCurrentChord)
  }, [api, indexCurrentChord])

  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    if (itemRefs.current[indexCurrentChord]) {
      const selectedElement = itemRefs.current[indexCurrentChord]
      if (selectedElement && listRef.current) {
        const selectedElementPosition = selectedElement.offsetTop
        const centerPosition =
          selectedElementPosition - listRef.current.offsetHeight / 2 + selectedElement.offsetHeight / 2
        listRef.current.scrollTo({ top: centerPosition, behavior: 'smooth' })
      }
    }
  }, [indexCurrentChord])

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
      <ul ref={listRef} className="grid grid-cols-4 p-3">
        {chordProgression.chords.map((chord, i) => (
          <GuitarChord key={i} chord={chord} current={isChordPlaying(i)} carousel={false} />
        ))}
      </ul>
    </>
  )
}

export default GuitarProgViewer
