'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'

export function AuthButton() {
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })

  return (
    <div className="flex items-center gap-2">
      {credits && (
        <span className="text-sm text-muted-foreground">
          {credits.isAuthenticated 
            ? `${credits.credits} credits`
            : `${credits.credits} / 3 free prompts`
          }
        </span>
      )}
      <Button size="sm" disabled>
        Sign In (Coming Soon)
      </Button>
    </div>
  )
}
