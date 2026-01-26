'use client'

import ModeToggle from '@/components/mode-toggle'
import { Icons } from '@/components/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import About from '@/components/about'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DEFAULT_MUSICAL_KEY } from '@/components/user-input'
import { useInstrumentViewer } from '@/components/player/instrument-viewer-context'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InstrumentTab } from '@/components/player/player-settings'

export default function Header() {
  const [{ description, musicalKey, musicalScale }] = useGenerateSearchParams()
  const { props: instrumentViewer } = useInstrumentViewer()
  const pathname = usePathname()
  const isGeneratePage = pathname === '/generate'
  return (
    <header className="flex-shrink-0 relative">
      <nav className="flex gap-4 items-center px-4 py-2" aria-label="Global">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Icons.mascot className="h-6 w-6" />
          </Link>
          {description && (
          <h2 className="italic">{`“${description}”`}</h2>
          )}
        </div>
        {isGeneratePage && instrumentViewer && (
          <div className="hidden md:flex absolute" style={{ left: 'calc(1rem + 25rem + 1rem)' }}>
            <Tabs value={instrumentViewer.activeTab} onValueChange={(v) => instrumentViewer.setActiveTab(v as InstrumentTab)}>
              <TabsList className="gap-1 bg-transparent p-0">
                <TabsTrigger 
                  value="midi" 
                  className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
                >
                  <Icons.music className="size-4" />
                  <span className="instrument-tab-text">MIDI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="guitar" 
                  className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
                >
                  <Icons.guitar className="size-4" />
                  <span className="instrument-tab-text">Guitar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="piano" 
                  className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
                >
                  <Icons.piano className="size-4" />
                  <span className="instrument-tab-text">Piano</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <About />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
