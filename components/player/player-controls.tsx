'use client'

import { FC } from 'react'
import { Button } from '../ui/button'
import { Icons } from '../icons'

interface PlayerControlsProps {
  progressionsLength: number
  indexCurrentProgression: number
  isPlaying: boolean
  loop: boolean
  setLoop: React.Dispatch<React.SetStateAction<boolean>>
  setIndexCurrentProgression: React.Dispatch<React.SetStateAction<number>>
  stopProgression: () => void
  playProgression: (indexChordProgression: number) => void
}

const ICON_SIZE = 20

const PlayerControls: FC<PlayerControlsProps> = (props) => {
  const {
    progressionsLength,
    indexCurrentProgression,
    isPlaying,
    loop,
    setLoop,
    setIndexCurrentProgression,
    stopProgression,
    playProgression,
  } = props
  return (
    <div className="flex flex-1 flex-row items-center justify-around p-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => {
          setIndexCurrentProgression((curr) => {
            let randomIndex
            do {
              randomIndex = Math.floor(Math.random() * progressionsLength)
            } while (randomIndex === curr)
            playProgression(randomIndex)
            return randomIndex
          })
        }}
      >
        <Icons.random size={17} />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() =>
          setIndexCurrentProgression((curr) => {
            if (curr - 1 < 0) {
              return progressionsLength - 1
            } else {
              return curr - 1
            }
          })
        }
      >
        <Icons.skipBack size={20} />
      </Button>
      {isPlaying ? (
        <Button variant="secondary" size="icon" onClick={() => stopProgression()}>
          <Icons.pause size={20} />
        </Button>
      ) : (
        <Button variant="secondary" size="icon" onClick={() => playProgression(indexCurrentProgression)}>
          <Icons.play size={20} />
        </Button>
      )}
      <Button
        variant="secondary"
        size="icon"
        onClick={() =>
          setIndexCurrentProgression((curr) => {
            if (curr + 1 == progressionsLength) {
              return 0
            } else {
              return curr + 1
            }
          })
        }
      >
        <Icons.skipForward size={ICON_SIZE} />
      </Button>
      <Button variant={loop ? 'default' : 'secondary'} size={'icon'} onClick={() => setLoop((loop) => !loop)}>
        <Icons.repeat size={21} />
      </Button>
    </div>
  )
}

export default PlayerControls
