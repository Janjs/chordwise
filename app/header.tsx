'use client'

import ModeToggle from '@/components/mode-toggle'
import { Icons } from '@/components/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSearchParams } from 'next/navigation'
import About from '@/components/about'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [{ description, musicalKey, musicalScale }, setParams] = useGenerateSearchParams()
  return (
    <header className="bg-transparent">
      <nav className="mx-auto flex gap-4 max-w-7xl items-center justify-between p-6 px-8" aria-label="Global">
        <Icons.logo className="h-5 w-auto" />
        {description && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="title">
                <i>{`“${description}”`}</i>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="grid gap-4">
                {description && (
                  <div className="space-y-2">
                    <h4 className="text-sm text-muted-foreground">Description</h4>
                    <p className="font-medium leading-none">{description}</p>
                  </div>
                )}
                {musicalKey && musicalScale && (
                  <div className="space-y-2">
                    <h4 className="text-sm text-muted-foreground">Key</h4>
                    <p className="font-medium leading-none">{`${musicalKey} ${musicalScale}`}</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <div className="flex gap-3">
          <About />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
