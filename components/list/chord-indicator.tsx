'use client'

import { Progression } from '@/types/types'
import { FC, useRef, useEffect, useLayoutEffect, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const canScroll = scrollWidth > clientWidth
      const maxScroll = scrollWidth - clientWidth
      
      setShowLeftFade(canScroll && scrollLeft > 0.5)
      setShowRightFade(canScroll && scrollLeft < maxScroll - 0.5)
    }

    checkScroll()
    
    const scrollHandler = () => checkScroll()
    container.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('resize', checkScroll)

    const observer = new MutationObserver(() => {
      setTimeout(checkScroll, 0)
    })
    observer.observe(container, { childList: true, subtree: true, attributes: true })

    return () => {
      container.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', checkScroll)
      observer.disconnect()
    }
  }, [progressions])

  return (
    <div ref={containerRef} className="hidden md:flex flex-none overflow-x-auto custom-scrollbar gap-2 items-center relative">
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      {progressions.map((progression, progIndex) => (
        <div key={progIndex} className="flex items-center gap-2">
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
  )
}

export default ChordIndicator
