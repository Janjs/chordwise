'use client'

import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import UserInput from './user-input'
import { SubmitHandler } from 'react-hook-form'
import { Inputs } from '@/app/generate/page'
import { GenerateProgressionsRequest } from '@/types/types'

const userInputWrapper = () => {
  const [params, setParams] = useGenerateSearchParams()

  const handleSubmit: SubmitHandler<Inputs> = async (input) => {
    const generateProgressionsRequest: GenerateProgressionsRequest = {
      description: input.description,
      musicalKey: input.musicalKey,
      musicalScale: input.musicalScale,
    }
    setParams(generateProgressionsRequest)
  }

  return <UserInput isLoading={false} onSubmit={handleSubmit} />
}

export default userInputWrapper
