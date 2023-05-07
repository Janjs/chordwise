import Image from 'next/image'
import { Input } from "@/components/ui/input"
import GeneratorInput from '@/components/GeneratorInput'
import { Separator } from '@/components/ui/separator';

export default async function Home() {
  return (
    <main className="flex max-w-screen flex-row justify-center p-24">
      <div className="flex-1 max-w-screen-lg flex flex-col">
        <GeneratorInput />
        <Separator className="my-5" />
      </div>
    </main>
  )
}

