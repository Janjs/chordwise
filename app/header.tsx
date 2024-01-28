'use client'

import ModeToggle from '@/components/mode-toggle'
import { Icons } from '@/components/icons'
import { usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import About from '@/components/about'
import Link from 'next/link'

export default function Header() {
  const pathname = usePathname()
  console.log(pathname)
  return (
    <header className="bg-transparent">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8" aria-label="Global">
        <Link href="/" className="flex-1">
          <Icons.logo className="h-5 w-auto" />
        </Link>
        <div className="flex flex-1 justify-end gap-3">
          <About />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
