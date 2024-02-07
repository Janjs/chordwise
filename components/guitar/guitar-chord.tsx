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
  console.log('suffix', chordInfo.type)
  console.log('guitarChord', guitar.chords[guitarMusicalKey])
  if (guitar.chords[guitarMusicalKey]) {
    svgChordData = guitar.chords[guitarMusicalKey].find((chordOptions: any) => {
      return chordOptions.suffix === guitarMusicalSuffix
    })
    console.log('svgChordData', svgChordData)
    // fallback to major if no suffic matches
    if (!svgChordData) {
      svgChordData = guitar.chords[guitarMusicalKey].find((chordOptions: any) => {
        return chordOptions.suffix === 'major'
      })
    }
  } else {
    console.log('Invalid property:', chordInfo)
  }

  const lite = false // defaults to false if omitted

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
        if (!props.dialog) {
          text.setAttribute('visibility', 'hidden')
          return
        }
        const textContent = text.textContent
        if (textContent !== null && !isNaN(parseFloat(textContent))) {
          text.setAttribute('fill', 'hsl(var(--background))')
        } else {
          text.setAttribute('fill', 'hsl(var(--foreground))')
        }
      })
    }
  }, [chordInfo])

  return (
    <div className="flex flex-col" ref={svgRef}>
      <h1
        className={`flex justify-center p-2 ${
          props.dialog ? 'scroll-m-20 text-3xl font-extrabold tracking-tight' : ''
        }`}
      >
        {props.chord.representation}
      </h1>
      <div className="">
        {svgChordData ? (
          <ChordSvg ref={svgRef} chord={svgChordData.positions[0]} instrument={INSTRUMENT} lite={lite} />
        ) : (
          <ChordSvg ref={svgRef} chord={DEFAULT_SVG_CHORD} instrument={INSTRUMENT} lite={lite} />
        )}
      </div>
    </div>
  )
}

export default GuitarChord
