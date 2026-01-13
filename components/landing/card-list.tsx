'use client'

import { Suggestion } from '@/types/types'
import { FC } from 'react'
import Card from './card'
import { Icons } from '../icons'

interface CardListProps {
  suggestions: Suggestion[]
}

const CardList: FC<CardListProps> = ({ suggestions }) => {
  return (
    <div className="pb-10">
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Icons.lightbulb className="h-4 w-4" />
        <p className="text-sm">Need inspiration? Try one of these:</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3 pb-4">
        {suggestions.map((suggestion: Suggestion, i: number) => (
          <Card suggestion={suggestion} key={i} />
        ))}
      </div>
    </div>
  )
}

export default CardList
