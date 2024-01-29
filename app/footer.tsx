'use client'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { GITHUB_LINK, TWITTER_LINK } from '@/lib/utils'
import { navigateToGithub } from './_actions'

export default function Footer() {
  return (
    <div className="flex justify-center">
      <p className="max-w-7xl w-full px-4 pb-4 text-right text-xs text-muted-foreground">
        <HoverCard>
          <HoverCardTrigger className="hover:cursor-pointer">
            💻 by{' '}
            <Button
              onClick={(e) => navigateToGithub()}
              variant="link"
              size="nopadding"
              className="hover:underline hover:underline-offset-4"
            >
              @Janjs.
            </Button>{' '}
          </HoverCardTrigger>
          <HoverCardContent className="w-30">
            <div className="grid gap-4 text-start text-md text-foreground">
              <a href={GITHUB_LINK} className="gap-2">
                <Icons.gitHub className="w-4 h-4 mb-1 inline text-muted-foreground" />{' '}
                <p className="inline hover:underline hover:underline-offset-4">Janjs</p>
              </a>
              <a href={TWITTER_LINK}>
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
