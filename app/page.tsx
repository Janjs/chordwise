'use client'

import { Suspense } from 'react'
import Link from 'next/link'
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
        <Link
          href="https://stroop.chat"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Badge
            variant="outline"
            className="flex h-7 w-fit cursor-pointer items-center gap-2 border-foreground/20 bg-card/80 shadow-sm backdrop-blur transition-colors hover:bg-card/90"
          >
            <span className="leading-none">Try stroop too!</span>
            <Icons.stroopMascot className="h-4 w-4 shrink-0" />
          </Badge>
        </Link>
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
        <h1 className="text-3xl md:text-5xl font-bold flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-outfit">
          <span>Create musical</span>
          <span className="flex items-center whitespace-nowrap">
            <span>chor</span>
            <Icons.mascot className="h-7.5 w-7.5 md:h-12 md:w-12 -ml-[0.3rem] -mt-2 md:-ml-2.5 md:-mt-2.5 translate-y-1 md:-mr-1.5" />
            <span>progressions</span>
          </span>
        </h1>
        <h3 className="text-sm md:text-xl text-muted-foreground">Generate chord progression MIDIs and view them as guitar chords</h3>
        <Suspense fallback={null}>
          <LandingInput />
        </Suspense>
      </div>
    </div>
  )
}

export default Page
