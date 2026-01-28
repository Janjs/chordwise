'use client'

import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { useInstrumentViewer } from '@/components/player/instrument-viewer-context'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InstrumentTab } from '@/components/player/player-settings'
import { AuthButton } from '@/components/auth/auth-button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { useConvexAuth } from 'convex/react'

export default function Header() {
  const [prompt] = useGenerateSearchParams()
  const { props: instrumentViewer } = useInstrumentViewer()
  const pathname = usePathname()
  const isGeneratePage = pathname === '/generate'
  const { isAuthenticated } = useConvexAuth()

  return (
    <header className="flex-shrink-0 relative">
      <nav className="flex gap-4 items-center px-4 py-3 min-h-[3.5rem]" aria-label="Global">
        <div className="flex items-center gap-3 flex-shrink-0">
          {isAuthenticated && <SidebarTrigger className="md:hidden" />}
          {!isAuthenticated && (
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="flex aspect-square items-center justify-center">
                <Icons.mascot className="size-6.5" />
              </div>
              <div className="flex-1 text-left text-sm leading-tight">
                <Icons.logo className="h-5 w-auto" />
              </div>
            </Link>
          )}
          {prompt ? (
            <h2 className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[22rem]">{`${prompt}`}</h2>
          ) : null}
        </div>
        {isGeneratePage && instrumentViewer && (
          <div className="hidden md:flex">
            <Tabs value={instrumentViewer.activeTab} onValueChange={(v) => instrumentViewer.setActiveTab(v as InstrumentTab)}>
              <TabsList className="gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="midi"
                  className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
                >
                  <Icons.piano className="size-4" />
                  <span className="instrument-tab-text">MIDI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="guitar"
                  className="rounded-lg border px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 justify-center data-[state=active]:justify-start"
                >
                  <Icons.guitar className="size-4" />
                  <span className="instrument-tab-text">Guitar</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="flex gap-3 ml-auto items-center">
          <AuthButton />
        </div>
      </nav>
    </header>
  )
}
