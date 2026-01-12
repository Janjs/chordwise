'use client'

import { Progression } from '@/types/types'
import { FC, createRef, useEffect, useRef } from 'react'

interface ProgressionItemProps {
  index: number
  progression: Progression
  handlePlay: (i: number) => void
  indexCurrentProgression: number
  indexCurrentChord: number
}

const ProgressionItem: FC<ProgressionItemProps> = (props) => {
  const { index, progression, handlePlay, indexCurrentProgression, indexCurrentChord } = props

  const isCurrentChord = (chord: number) => indexCurrentProgression == index && indexCurrentChord === chord

  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLHeadingElement | null)[]>([])

  useEffect(() => {
    if (itemRefs.current[indexCurrentChord] && indexCurrentProgression == index) {
      const selectedElement = itemRefs.current[indexCurrentChord]
      if (selectedElement && listRef.current) {
        const selectedElementPosition = selectedElement.offsetLeft
        const centerPosition =
          selectedElementPosition - listRef.current.offsetWidth / 2 + selectedElement.offsetWidth / 2
        listRef.current.scrollTo({ left: centerPosition, behavior: 'smooth' })
      }
    }
  }, [indexCurrentChord])

  return (
    <div
      ref={listRef}
      onClick={() => handlePlay(index)}
      className={`p-4 mb-4 flex flex-row rounded-2xl hover:bg-secondary overflow-x-auto gap-4
         ${indexCurrentProgression == index ? 'bg-card' : 'border border-card'} 
      `}
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {progression.chords.map((chord, j) => (
        <h1
          key={j}
          ref={(el) => { itemRefs.current[j] = el }}
          className={`flex-none width-with-gap
        aspect-square flex items-center justify-center rounded-lg border text-xl md:text-sm lg:text-2xl font-bold 
            ${isCurrentChord(j) ? 'bg-primary' : ''} 
            ${indexCurrentProgression == index ? 'border-primary' : 'border-card'}
            ${isCurrentChord(j) ? 'selected' : ''}
         `}
        >
          {chord.representation}
        </h1>
      ))}
    </div>
  )
}

export default ProgressionItem
