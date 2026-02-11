'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import LandingInput from '@/components/landing/landing-input'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] w-full max-w-full">
      <div className="flex flex-col w-full max-w-full gap-4 items-center text-center px-4">
        <Link
          href="https://stroop.janjs.dev"
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
