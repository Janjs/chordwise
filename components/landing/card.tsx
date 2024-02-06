'use client'

import { FC } from 'react'
import { Badge } from '../ui/badge'
import { GenerateProgressionsRequest, Suggestion } from '@/types/types'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'

interface CardProps {
  suggestion: Suggestion
}

const Card: FC<CardProps> = ({ suggestion }) => {
  const [params, setParams] = useGenerateSearchParams()

  const handleClick = () => {
    const generateProgressionsRequest: GenerateProgressionsRequest = {
      description: suggestion.description,
      musicalKey: suggestion.musicalKey,
      musicalScale: suggestion.musicalScale,
      suggestionIndex: suggestion.key,
    }
    setParams(generateProgressionsRequest)
  }

  return (
    <div className="p-3 border border-primary rounded-2xl hover:bg-secondary" onClick={handleClick}>
      <div className="mb-3 flex gap-2 text-sm">
        <Badge>{suggestion.description}</Badge>
        {suggestion.musicalKey && suggestion.musicalScale && (
          <Badge>
            {suggestion.musicalKey} {suggestion.musicalScale}
          </Badge>
        )}
      </div>
      <div className="flex flex-rowhover:bg-secondary overflow-x-auto gap-4" style={{ scrollSnapType: 'x mandatory' }}>
        {suggestion.progressions[0].chords.map((chord, j) => (
          <h1
            key={j}
            className={`flex-none width-with-gap border-primary
          aspect-square flex items-center justify-center rounded-lg border text-xl xl:text-2xl font-bold 
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
