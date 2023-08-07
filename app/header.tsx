'use client'

import ModeToggle from '@/components/mode-toggle'
import ThemedLogo from '@/assets/themed-logo'
import { Icons } from '@/components/icons'
import { usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import About from '@/components/about'
import Link from 'next/link'

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="bg-transparent">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8" aria-label="Global">
        <Link href="/" className="flex-1">
          <Icons.logo className="h-5 w-auto" />
        </Link>
        <div className="flex-1 flex italic justify-center text-center">
          {!(pathname === '/') && (
            <Tabs defaultValue="generate" className="w-[250px] flex justify-center">
              <TabsList>
                <TabsTrigger value="generate" className="gap-2">
                  Generate
                  <Icons.generate size={15} />
                </TabsTrigger>
                <TabsTrigger value="explore" className="gap-2">
                  Explore
                  <Icons.cassette size={18} />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="generate"></TabsContent>
              <TabsContent value="explore"></TabsContent>
            </Tabs>
          )}
        </div>
        <div className="flex flex-1 justify-end gap-5">
          <About />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
