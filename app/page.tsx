'use client'

import { Suspense } from 'react'
import LandingInput from '@/components/landing/landing-input'
import { Icons } from '@/components/icons'

const Page = () => {
  return (
    <div className="flex flex-col px-4 items-center justify-center min-h-[calc(100dvh-60px)]">
      <div className="flex flex-col max-w-5xl w-full gap-4 items-center text-center">
        <Icons.logo className="h-10 md:h-14 w-auto" />
        <h1 className="text-3xl md:text-5xl font-bold">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</span> Chord
          Progression Generator
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
