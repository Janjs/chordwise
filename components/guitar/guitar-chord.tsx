'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { default as ChordSvg } from '@tombatossals/react-chords/lib/Chord'
import { Chord } from '@/types/types'
const guitar = require(`@tombatossals/chords-db/lib/guitar.json`)

interface GuitarChordProps {
  chord: Chord
  dialog: boolean
}

const instrument = Object.assign(guitar.main, { tunings: guitar.tunings })

const GuitarChord: FC<GuitarChordProps> = (props) => {
  const chord = props.chord
  let svgChordData
  if (guitar.chords[chord.key]) {
    svgChordData = guitar.chords[chord.key].find((chordOptions: any) => chordOptions.suffix === chord.suffix)
    // Use chord here
  } else {
    console.log('Invalid property:', chord)
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
  }, [chord])

  return (
    <div className="flex flex-col" ref={svgRef}>
      <h1 className={`p-2 flex justify-center ${props.dialog ? 'text-3xl' : ''}`}>{props.chord.representation}</h1>
      <div>
        {svgChordData && (
          <ChordSvg ref={svgRef} chord={svgChordData.positions[0]} instrument={instrument} lite={lite} />
        )}
      </div>
    </div>
  )
}

export default GuitarChord
