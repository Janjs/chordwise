'use client'

import { FC, useEffect, useRef, useState } from 'react'
import Chord from '@tombatossals/react-chords/lib/Chord'

interface ChordViewerProps {
  chord: string
}

const ChordViewer: FC<ChordViewerProps> = (props) => {
  const chord = {
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [1],
    capo: false,
  }
  const instrument = {
    strings: 6,
    fretsOnChord: 4,
    name: 'Guitar',
    keys: [],
    tunings: {
      standard: ['E', 'A', 'D', 'G', 'B', 'E'],
    },
  }
  const lite = false // defaults to false if omitted

  const svgRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (svgRef.current) {
      const shapes = svgRef.current.querySelectorAll('path, circle, rect')
      shapes.forEach((shape) => {
        shape.setAttribute('fill', 'hsl(var(--background))')
        shape.setAttribute('stroke', 'hsl(var(--background))')
      })
      const texts = svgRef.current.querySelectorAll('text')
      texts.forEach((text) => {
        text.setAttribute('fill', 'hsl(var(--foreground))')
      })
    }
  }, [])

  return (
    <h1
      className={`[&>svg]:text-foreground  ring-offset-background ring-2 ring-ring 
      ring-offset-2 rounded-lg aspect-square flex flex-col justify-center items-center p-2`}
      ref={svgRef}
    >
      {props.chord}
      <Chord chord={chord} instrument={instrument} lite={lite} />
    </h1>
  )
}

export default ChordViewer
