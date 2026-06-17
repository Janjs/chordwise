'use client'

import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'

type ChatToolCallCardProps = {
  isLoading: boolean
  loadingLabel: string
  completedLabel: string
  idleLabel?: string
  onClick?: () => void
  className?: string
}

export function ChatToolCallCard({
  isLoading,
  loadingLabel,
  completedLabel,
  idleLabel = 'Chord Progression Tool',
  onClick,
  className,
}: ChatToolCallCardProps) {
  const isCompleted = !isLoading && Boolean(onClick)
  const MascotIcon = isLoading ? Icons.mascotSleeping : Icons.mascot
  const label = isLoading ? loadingLabel : isCompleted ? completedLabel : idleLabel

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border bg-muted/30 p-3 transition-shadow',
        isLoading && 'animate-pulse shadow-[0_0_15px_hsl(var(--primary)/0.4)]',
        isCompleted && 'cursor-pointer hover:bg-muted/50',
        className,
      )}
      onClick={isCompleted ? onClick : undefined}
    >
      <MascotIcon className={cn('size-5', isLoading && 'opacity-50')} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
