'use client'

import { Suggestion } from '@/types/types'
import { FC, useEffect, useRef, useState } from 'react'
import Card from './card'

interface CardListProps {
  suggestions: Suggestion[]
}

const CardList: FC<CardListProps> = ({ suggestions }) => {
  return (
    <div className="pb-10">
      <p className="mb-2 ml-1">Examples:</p>
      <div className="grid md:grid-cols-2 gap-3 pb-4">
        {suggestions.map((suggestion: Suggestion, i: number) => (
          <Card suggestion={suggestion} key={i} />
        ))}
      </div>
    </div>
  )
}

export default CardList
