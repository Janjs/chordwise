import { Progression } from '@/types/types'
import { FC, useEffect, useRef } from 'react'
import ProgressionItem from './progression-item'

interface ProgressionListProps {
  progressions: Progression[]
  handlePlay: (i: number) => void
  indexCurrentProgression: number
  indexCurrentChord: number
}

const ProgressionList: FC<ProgressionListProps> = (props) => {
  const { progressions, handlePlay, indexCurrentProgression, indexCurrentChord } = props

  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    if (itemRefs.current[indexCurrentProgression]) {
      const selectedElement = itemRefs.current[indexCurrentProgression]
      if (selectedElement && listRef.current) {
        const selectedElementPosition = selectedElement.offsetTop
        const centerPosition =
          selectedElementPosition - listRef.current.offsetHeight / 2 + selectedElement.offsetHeight / 2
        listRef.current.scrollTo({ top: centerPosition, behavior: 'smooth' })
      }
    }
  }, [indexCurrentProgression])

  return (
    <ul ref={listRef} className="flex-1 overflow-y-auto">
      {progressions.map((progression, index) => (
        <li key={index} ref={(el) => (itemRefs.current[index] = el)}>
          <ProgressionItem
            index={index}
            progression={progression}
            handlePlay={handlePlay}
            indexCurrentProgression={indexCurrentProgression}
            indexCurrentChord={indexCurrentChord}
          />
        </li>
      ))}
    </ul>
  )
}

export default ProgressionList
