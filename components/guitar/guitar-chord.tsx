'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { default as ChordSvg } from '@tombatossals/react-chords/lib/Chord'
import { Chord as TonalChord } from 'tonal'
import { Chord } from '@/types/types'
import {
  MusicalKey,
  MusicalSuffix,
  mapMusicalKeyToGuitarSvg,
  mapMusicalSuffixToGuitarSvg,
} from '@/lib/guitar-svg-utils'
import { Icons } from '@/components/icons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
const guitar = require(`@tombatossals/chords-db/lib/guitar.json`)

interface GuitarChordProps {
  chord: Chord
  current: boolean
  carousel: boolean
}

const INSTRUMENT = Object.assign(guitar.main, { tunings: guitar.tunings })
const DEFAULT_SVG_CHORD = {
  frets: [],
  fingers: [],
  barres: [],
  capo: false,
}

const GuitarChord: FC<GuitarChordProps> = (props) => {
  const chordInfo = TonalChord.get(props.chord.representation)
  const guitarMusicalKey = mapMusicalKeyToGuitarSvg(chordInfo.tonic as MusicalKey)
  const guitarMusicalSuffix = mapMusicalSuffixToGuitarSvg(chordInfo.type as MusicalSuffix)

  // construct guitar SVG
  let svgChordData
  if (guitar.chords[guitarMusicalKey]) {
    svgChordData = guitar.chords[guitarMusicalKey].find((chordOptions: any) => {
      return chordOptions.suffix === guitarMusicalSuffix
    })
  } else {
    console.log('Invalid property:', chordInfo)
  }

  const svgRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (svgRef.current) {
      const svg = svgRef.current.querySelector('svg')
      svg?.setAttribute('viewBox', '0 5 78 66')
      const shapes = svgRef.current.querySelectorAll('path, circle, rect')
      shapes.forEach((shape) => {
        if (props.current) {
          shape.setAttribute('fill', 'hsl(var(--foreground))')
          shape.setAttribute('stroke', 'hsl(var(--foreground))')
        } else {
          shape.setAttribute('fill', 'hsl(var(--muted-foreground))')
          shape.setAttribute('stroke', 'hsl(var(--muted-foreground))')
        }
      })
      const texts = svgRef.current.querySelectorAll('text')
      texts.forEach((text) => {
        const textContent = text.textContent
        if (textContent?.includes('fr')) {
          text.setAttribute('y', '1')
          text.setAttribute('x', '-13')
          text.setAttribute('font-size', '0.4rem')
          text.setAttribute('fill', 'hsl(var(--foreground))')
          return
        }
        if (!props.carousel) {
          text.setAttribute('visibility', 'hidden')
          return
        }
        if (textContent !== null && !isNaN(parseFloat(textContent))) {
          text.setAttribute('fill', 'hsl(var(--background))')
        } else {
          text.setAttribute('fill', 'hsl(var(--foreground))')
        }
      })
    }
  }, [chordInfo])

  return (
    <div className="flex flex-col my-auto items-center">
      <h1
        className={`inline-flex gap-1 items-center pb-2 ${props.carousel ? 'text-3xl font-bold' : 'text-sm'} ${props.current ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {props.chord.representation}
        {!svgChordData && !props.carousel && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Icons.warning size={15} className="text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Guitar chord not found</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </h1>
      <div ref={svgRef} className="max-w-[270px] mb-2">
        {svgChordData ? (
          <ChordSvg chord={svgChordData.positions[0]} instrument={INSTRUMENT} />
        ) : (
          <ChordSvg chord={DEFAULT_SVG_CHORD} instrument={INSTRUMENT} />
        )}
      </div>
    </div>
  )
}

export default GuitarChord
