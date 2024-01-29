import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

export default function Footer() {
  return (
    <div className="bg-background/80">
      {/*Make this a hover-card https://ui.shadcn.com/docs/components/hover-card*/}
      <p className="px-4 pb-4 text-right text-xs text-muted-foreground">
        <HoverCard>
          <HoverCardTrigger className="hover:cursor-pointer">
            💻 by{' '}
            <a
              href="https://github.com/Janjs"
              target="_blank"
              className="mb-10 hover:underline hover:underline-offset-4"
            >
              @Janjs.
            </a>{' '}
          </HoverCardTrigger>
          <HoverCardContent className="w-30">
            <div className="grid gap-4 text-start text-md text-foreground">
              <a href="https://github.com/Janjs" className="gap-2">
                <Icons.gitHub className="w-4 h-4 mb-1 inline text-muted-foreground" />{' '}
                <p className="inline hover:underline hover:underline-offset-4">Janjs</p>
              </a>
              <a href="https://x.com/Janjijs">
                <Icons.twitter className="w-4 h-4 inline text-muted-foreground hover:underline hover:underline-offset-4" />{' '}
                <p className="inline hover:underline hover:underline-offset-4">Janjijs</p>
              </a>
            </div>
          </HoverCardContent>
        </HoverCard>
      </p>
    </div>
  )
}
