'use client'

import { Suspense } from 'react'
import LandingInput from '@/components/landing/landing-input'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { usePathname, useSearchParams } from 'next/navigation'

const Page = () => {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleStartWithChordwise = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] w-full max-w-full">
      <div className="flex flex-col w-full max-w-full gap-4 items-center text-center px-4">
        {!isLoading && !isAuthenticated && (
          <Badge
            className="flex h-7 border border-foreground/20 items-center gap-2 bg-card/80 text-foreground shadow-sm backdrop-blur cursor-pointer hover:bg-card/90 transition-colors"
            onClick={handleStartWithChordwise}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="flex items-center gap-1 leading-none">
              Start with
              <Icons.logo className="h-2.75 w-auto translate-y-[-1.2px]" />
            </span>
          </Badge>
        )}
        <h1 className="text-3xl md:text-5xl font-bold flex flex-row items-center justify-center gap-2 font-outfit">
          <span>Create musical chord progressions</span>
        </h1>
        <h3 className="text-md md:text-xl text-muted-foreground">Enhance, not replace, your musical creativity</h3>
        <Suspense fallback={null}>
          <LandingInput />
        </Suspense>
      </div>
    </div>
  )
}

export default Page
