import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GenerateProgressionsRequest } from '@/types/types'
import { useMemo } from 'react'

export const DESCRIPTION_PARAM_KEY = 'description'
export const MUSICAL_KEY_PARAM_KEY = 'musicalKey'
export const MUSICAL_SCALE_PARAM_KEY = 'musicalScale'

const useGenerateSearchParams = (): [
  params: GenerateProgressionsRequest,
  setParams: (newParams: GenerateProgressionsRequest) => void,
] => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const params = useMemo(() => {
    const description = searchParams.get(DESCRIPTION_PARAM_KEY)
    const musicalKey = searchParams.get(MUSICAL_KEY_PARAM_KEY)
    const musicalScale = searchParams.get(MUSICAL_SCALE_PARAM_KEY)

    return { description, musicalKey, musicalScale } as GenerateProgressionsRequest
  }, [searchParams])

  const setParams = (newParams: GenerateProgressionsRequest) => {
    const params = new URLSearchParams(searchParams.toString())

    params.set(DESCRIPTION_PARAM_KEY, newParams.description)
    params.set(MUSICAL_KEY_PARAM_KEY, newParams.musicalKey)
    params.set(MUSICAL_SCALE_PARAM_KEY, newParams.musicalScale)

    router.push(`generate?${params.toString()}`)
  }

  return [params, setParams]
}

export default useGenerateSearchParams
