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
    <div className="flex flex-1 flex-row items-center justify-around gap-5 p-5">
      <Button
        variant="ghost"
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
        <Icons.skipBack size={25} />
      </Button>
      {isPlaying ? (
        <Button variant="ghost" size="icon" onClick={() => stopProgression()}>
          <Icons.pause size={25} />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => playProgression(indexCurrentProgression)}>
          <Icons.play size={25} />
        </Button>
      )}
      <Button
        variant="ghost"
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
        <Icons.skipForward size={25} />
      </Button>
      <Button variant={loop ? 'default' : 'ghost'} onClick={() => setLoop((loop) => !loop)}>
        <Icons.repeat size={25} />
      </Button>
    </div>
  )
}

export default PlayerControls
