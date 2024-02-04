import UserInputWrapper from '@/components/user-input-wrapper'
import Card from '@/components/card'
import { promises as fs } from 'fs'
import { Suggestion } from '@/types/types'

const Page = async () => {
  const suggestionsFile = await fs.readFile(process.cwd() + '/data/suggestions.json', 'utf8')
  const suggestions: Suggestion[] = JSON.parse(suggestionsFile)

  return (
    <div className="flex flex-col mx-4">
      <div className="pt-[10vh] pb-[5vh] flex flex-col max-w-7xl gap-5 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">
          <p className="inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</p> Chord
          Progression Generator
        </h1>
        <h3 className="text-md md:text-xl">Enhance, not replace, your musical creativity🎵✨</h3>
        <UserInputWrapper />
      </div>
      <div className="flex-1 py-10 overflow-y-scroll overflow-hidden [mask-image:_linear-gradient(to_bottom,transparent_0,_black_70px,_black_calc(100%-70px),transparent_100%)]">
        {suggestions.map((suggestion: Suggestion, i: number) => (
          <Card suggestion={suggestion} key={i} />
        ))}
      </div>
    </div>
  )
}

export default Page
