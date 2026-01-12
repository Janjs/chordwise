import { Suspense } from 'react'
import UserInputWrapper from '@/components/user-input-wrapper'
import { promises as fs } from 'fs'
import { Suggestion } from '@/types/types'
import CardList from '@/components/landing/card-list'
import path from 'path'

export const dynamic = 'force-dynamic'

const Page = async () => {
  const suggestionsFile = await fs.readFile(path.join(process.cwd(), 'public', 'suggestions.json'), 'utf8')
  const suggestions: Suggestion[] = JSON.parse(suggestionsFile)

  return (
    <div className="flex flex-col mx-4 items-center">
      <div className="pt-[8dvh] md:pt-[10dvh] py-[5dvh] md:py-[8dvh] flex flex-col max-w-5xl gap-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold">
          <p className="inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</p> Chord
          Progression Generator
        </h1>
        <h3 className="text-md md:text-xl text-muted-foreground">Enhance, not replace, your musical creativity🎵✨</h3>
        <Suspense fallback={null}>
          <UserInputWrapper />
        </Suspense>
      </div>
      <CardList suggestions={suggestions} />
    </div>
  )
}

export default Page
