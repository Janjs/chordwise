import { FC } from 'react'
import { Badge } from '../ui/badge'
import { Suggestion } from '@/types/types'

interface CardProps {
  suggestion: Suggestion
}

const Card: FC<CardProps> = ({ suggestion }) => {
  return (
    <div className="p-3 mb-4 border border-primary rounded-2xl hover:bg-secondary">
      <div className="mb-3 flex gap-2">
        <Badge>
          <p className="text-sm">{suggestion.description}</p>
        </Badge>
        <Badge>
          {suggestion.musicalKey} {suggestion.musicalScale}
        </Badge>
      </div>
      <div className="flex flex-rowhover:bg-secondary overflow-x-auto gap-4" style={{ scrollSnapType: 'x mandatory' }}>
        {suggestion.progression.chords.map((chord, j) => (
          <h1
            key={j}
            className={`flex-none width-with-gap border-primary
          aspect-square flex items-center justify-center rounded-lg border text-2xl font-bold 
           `}
          >
            {chord.representation}
          </h1>
        ))}
      </div>
    </div>
  )
}

export default Card
