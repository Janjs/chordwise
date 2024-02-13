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
  dialog: boolean
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
      const shapes = svgRef.current.querySelectorAll('path, circle, rect')
      shapes.forEach((shape) => {
        shape.setAttribute('fill', 'hsl(var(--foreground))')
        shape.setAttribute('stroke', 'hsl(var(--foreground))')
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
        if (!props.dialog) {
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
    <div className="flex flex-col">
      <h1
        className={`flex justify-center items-center p-2 ${
          props.dialog ? 'scroll-m-20 text-3xl font-extrabold tracking-tight' : ''
        }`}
      >
        {props.chord.representation}
        {!svgChordData && (
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
      <div ref={svgRef}>
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
