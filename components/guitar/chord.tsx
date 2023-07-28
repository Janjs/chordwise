'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { default as ChordSvg } from '@tombatossals/react-chords/lib/Chord'
import { useTheme } from 'next-themes'

interface ChordProps {
  chord: string
}

const Chord: FC<ChordProps> = (props) => {
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
        shape.setAttribute('fill', 'hsl(var(--foreground))')
        shape.setAttribute('stroke', 'hsl(var(--foreground))')
      })
      const texts = svgRef.current.querySelectorAll('text')
      texts.forEach((text) => {
        const textContent = text.textContent
        if (textContent !== null && !isNaN(parseFloat(textContent))) {
          text.setAttribute('fill', 'hsl(var(--background))')
        } else {
          text.setAttribute('fill', 'hsl(var(--foreground))')
        }
      })
    }
  }, [])

  return (
    <div className="flex flex-col" ref={svgRef}>
      <h1 className="p-2 flex justify-center">{props.chord}</h1>
      <div>
        <ChordSvg ref={svgRef} chord={chord} instrument={instrument} lite={lite} />
      </div>
    </div>
  )
}

export default Chord
