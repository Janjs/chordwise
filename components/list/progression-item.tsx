'use client'

import { Progression } from '@/types/types'
import { FC, createRef, useEffect, useRef } from 'react'

interface ProgressionItemProps {
  index: number
  progression: Progression
  handlePlay: (i: number) => void
  isPlaying: (i: number) => boolean
  indexChordPlaying: number
}

const ProgressionItem: FC<ProgressionItemProps> = (props) => {
  const { index, progression, handlePlay, isPlaying, indexChordPlaying } = props
  const { chords } = progression

  const isCurrentChord = (chord: number) => isPlaying(index) && indexChordPlaying === chord

  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (itemRefs.current[indexChordPlaying] && isPlaying(index)) {
      const selectedElement = itemRefs.current[indexChordPlaying]
      if (selectedElement && listRef.current) {
        const selectedElementPosition = selectedElement.offsetLeft
        const centerPosition =
          selectedElementPosition - listRef.current.offsetWidth / 2 + selectedElement.offsetWidth / 2
        listRef.current.scrollTo({ left: centerPosition, behavior: 'smooth' })
      }
    }
  }, [indexChordPlaying])

  return (
    <div
      ref={listRef}
      onClick={() => handlePlay(index)}
      className={`p-4 mb-4 flex flex-row rounded-2xl hover:bg-secondary overflow-x-auto gap-4
         ${isPlaying(index) ? 'bg-card' : 'border border-card'} 
      `}
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {progression.chords.map((chord, j) => (
        <h1
          key={j}
          ref={(el) => (itemRefs.current[j] = el)}
          className={`flex-none width-with-gap
        aspect-square flex items-center justify-center rounded-lg border text-xl sm:text-xl md:text-md lg:text-2xl font-bold 
            ${isCurrentChord(j) ? 'bg-primary' : ''} 
            ${isPlaying(index) ? 'border-primary' : 'border-card'}
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
