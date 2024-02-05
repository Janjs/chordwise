import UserInputWrapper from '@/components/user-input-wrapper'
import { promises as fs } from 'fs'
import { Suggestion } from '@/types/types'
import CardList from '@/components/landing/card-list'

const Page = async () => {
  const suggestionsFile = await fs.readFile(process.cwd() + '/app/data/suggestions.json', 'utf8')
  const suggestions: Suggestion[] = JSON.parse(suggestionsFile)

  return (
    <div className="flex flex-col mx-4">
      <div className="pt-[10vh] pb-[5vh] flex flex-col max-w-7xl gap-5 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">
          <p className="inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</p> Chord
          Progression Generator
        </h1>
        <h3 className="text-md md:text-xl text-muted-foreground">Enhance, not replace, your musical creativity🎵✨</h3>
        <UserInputWrapper />
      </div>
      <CardList suggestions={suggestions} />
    </div>
  )
}

export default Page
