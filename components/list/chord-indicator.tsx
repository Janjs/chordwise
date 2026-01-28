'use client'

import { Progression } from '@/types/types'
import { FC, useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ChordIndicatorProps {
  progressions: Progression[]
  handlePlay: (i: number) => void
  indexCurrentProgression: number
  indexCurrentChord: number
}

const ChordIndicator: FC<ChordIndicatorProps> = (props) => {
  const { progressions, handlePlay, indexCurrentProgression, indexCurrentChord } = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport
      setShowLeftFade(scrollLeft > 0)
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    viewport.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      viewport.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const target = itemRefs.current[indexCurrentProgression]
    if (!viewport || !target) return

    const viewportRect = viewport.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const offset = targetRect.left - viewportRect.left + viewport.scrollLeft
    const centerPosition = offset - viewport.clientWidth / 2 + targetRect.width / 2

    viewport.scrollTo({ left: centerPosition, behavior: 'smooth' })
  }, [indexCurrentProgression, progressions.length])

  return (
    <div ref={wrapperRef} className="hidden md:flex flex-none items-center relative">
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={viewportRef}
        className="overflow-x-auto custom-scrollbar flex gap-2 items-center"
      >
        {progressions.map((progression, progIndex) => (
          <div
            key={progIndex}
            ref={(el) => {
              itemRefs.current[progIndex] = el
            }}
            className="flex items-center gap-2"
          >
            <Button
              variant="outline"
              className={`px-2 ${indexCurrentProgression === progIndex ? ' bg-secondary border-secondary' : ''}`}
              onClick={() => handlePlay(progIndex)}
            >
              {progression.chords.map((chord, chordIndex) => {
                const isCurrentChord = indexCurrentProgression === progIndex && indexCurrentChord === chordIndex

                return (
                  <span key={chordIndex} className="flex items-center">
                    <Badge
                      variant={isCurrentChord ? 'default' : 'outline'}
                      className="rounded-md px-2 py-1"
                    >
                      {chord.representation}
                    </Badge>
                    {chordIndex < progression.chords.length - 1 && (
                      <span className="mx-1 text-muted-foreground">›</span>
                    )}
                  </span>
                )
              })}
            </Button>
            {progIndex < progressions.length - 1 && (
              <Separator orientation="vertical" className="h-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChordIndicator
