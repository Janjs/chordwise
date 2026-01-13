import { Suspense } from 'react'
import UserInputWrapper from '@/components/user-input-wrapper'
import { promises as fs } from 'fs'
import { Suggestion } from '@/types/types'
import CardList from '@/components/landing/card-list'
import path from 'path'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

const Page = async () => {
  const suggestionsFile = await fs.readFile(path.join(process.cwd(), 'public', 'suggestions.json'), 'utf8')
  const suggestions: Suggestion[] = JSON.parse(suggestionsFile)

  return (
    <div className="flex flex-col mx-4 items-center">
      <div className="pt-[8dvh] md:pt-[10dvh] py-[5dvh] md:py-[8dvh] flex flex-col max-w-5xl gap-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</span> Chord
            Progression Generator
          </h1>
          <Icons.mascot className="h-9 w-9 md:h-12 md:w-12 flex-shrink-0" />
        </div>
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
