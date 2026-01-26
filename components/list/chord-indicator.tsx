'use client'

import { Progression } from '@/types/types'
import { FC } from 'react'
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

  return (
    <div className="hidden md:flex flex-none overflow-x-auto custom-scrollbar gap-2 items-center">
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
