'use client'

import { Suggestion } from '@/types/types'
import { FC, useEffect, useRef, useState } from 'react'
import Card from './card'

interface CardListProps {
  suggestions: Suggestion[]
}

const CardList: FC<CardListProps> = ({ suggestions }) => {
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number | null>(null)

  const autoScroll = () => {
    if (!scrollContainerRef.current || isUserInteracting) return

    const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight
    let newScrollPosition = scrollContainerRef.current.scrollTop + 0.5 // Adjust this value to control the speed

    if (newScrollPosition >= maxScroll) {
      newScrollPosition = 0 // Optionally reset to top when you reach the bottom
    }

    scrollContainerRef.current.scrollTop = newScrollPosition
    animationFrameId.current = window.requestAnimationFrame(autoScroll)
  }

  useEffect(() => {
    if (!isUserInteracting) {
      animationFrameId.current = window.requestAnimationFrame(autoScroll)
    }

    return () => {
      if (animationFrameId.current) {
        window.cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [isUserInteracting])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    const handleMouseEnter = () => setIsUserInteracting(true)
    const handleMouseLeave = () => setIsUserInteracting(false)

    scrollContainer?.addEventListener('mouseenter', handleMouseEnter)
    scrollContainer?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      scrollContainer?.removeEventListener('mouseenter', handleMouseEnter)
      scrollContainer?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className={`${
        isUserInteracting ? '' : 'custom-scrollbar'
      } flex-1 py-10 overflow-y-scroll overflow-hidden [mask-image:_linear-gradient(to_bottom,transparent_0,_black_50px,_black_calc(100%-50px),transparent_100%)]`}
    >
      {suggestions.map((suggestion: Suggestion, i: number) => (
        <Card suggestion={suggestion} key={i} />
      ))}
    </div>
  )
}

export default CardList
