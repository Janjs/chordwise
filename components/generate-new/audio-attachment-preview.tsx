'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { Loader2Icon, MicIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { PromptInputHeader, usePromptInputAttachments } from '@/components/ai-elements/prompt-input'
import { Button } from '@/components/ui/button'
import { extractWaveformPeaks, RecordedWaveform, MIN_BAR_LEVEL } from './audio-waveform'
import { useAudioRecordingStatus } from './audio-recording-status'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { isPlayableAudioUrl } from '@/lib/upload-recording'

const enterTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }

function HorizontalScrollWithFade({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport
      setShowLeftFade(scrollLeft > 0)
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    viewport.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    const observer = new MutationObserver(checkScroll)
    observer.observe(viewport, { childList: true, subtree: true })

    return () => {
      viewport.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      {showLeftFade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent dark:from-input/30" />
      )}
      {showRightFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent dark:from-input/30" />
      )}
      <div ref={viewportRef} className="flex h-8 w-full items-center justify-start gap-1.5 overflow-x-auto scrollbar-hide">
        {children}
      </div>
    </div>
  )
}

const loadingWaveformLevels = Array.from(
  { length: 24 },
  (_, index) => MIN_BAR_LEVEL + (index % 4) * 0.05,
)

export function AudioRecordingChipLoading({
  className,
  showRemove,
  onRemove,
}: {
  className?: string
  showRemove?: boolean
  onRemove?: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex h-8 min-w-0 items-center gap-1 rounded-md bg-card px-1 text-foreground',
        showRemove && 'pr-7',
        className,
      )}
    >
      <Button
        aria-label="Processing recording"
        size="icon"
        type="button"
        variant="ghost"
        className="h-6 w-6 shrink-0 pointer-events-none"
        disabled
      >
        <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
      </Button>
      <RecordedWaveform peaks={loadingWaveformLevels} compact className="animate-pulse opacity-70" />
      {showRemove && onRemove && (
        <Button
          aria-label="Remove recording"
          size="icon"
          type="button"
          variant="ghost"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onRemove()
          }}
        >
          <Trash2Icon className="size-3" />
        </Button>
      )}
    </div>
  )
}

function AudioRecordingPlayer({
  url,
  id,
  playingId,
  onTogglePlay,
  onPlayEnded,
  className,
}: {
  url: string
  id: string
  playingId: string | null
  onTogglePlay: (audio: HTMLAudioElement) => void
  onPlayEnded: () => void
  className?: string
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [progress, setProgress] = useState(0)
  const isPlaying = playingId === id

  useEffect(() => {
    let cancelled = false
    void extractWaveformPeaks(url).then((nextPeaks) => {
      if (!cancelled) setPeaks(nextPeaks)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let frameId: number

    const updateProgress = () => {
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    }

    const tick = () => {
      updateProgress()
      if (!audio.paused && !audio.ended) {
        frameId = requestAnimationFrame(tick)
      }
    }

    const handlePlay = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(tick)
    }

    const handlePause = () => {
      cancelAnimationFrame(frameId)
      updateProgress()
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('seeked', updateProgress)

    if (!audio.paused && !audio.ended) {
      frameId = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frameId)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('seeked', updateProgress)
    }
  }, [url, peaks])

  const handlePlayEnded = () => {
    setProgress(0)
    onPlayEnded()
  }

  if (peaks === null) {
    return <AudioRecordingChipLoading className={className} />
  }

  return (
    <div
      className={cn(
        'flex h-8 min-w-0 items-center gap-1 rounded-md bg-card px-1 text-foreground',
        className,
      )}
    >
      <audio ref={audioRef} src={url} onEnded={handlePlayEnded} className="hidden" />
      <Button
        aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        size="icon"
        type="button"
        variant="ghost"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!audioRef.current) return
          onTogglePlay(audioRef.current)
        }}
      >
        {isPlaying ? (
          <PauseIcon className="size-3 fill-current" />
        ) : (
          <PlayIcon className="size-3" />
        )}
      </Button>
      <RecordedWaveform peaks={peaks} progress={progress} isPlaying={isPlaying} compact />
    </div>
  )
}

export type MessageAudioItem = {
  url?: string
  storageId?: Id<'_storage'>
}

function MessageAudioRecordingItem({
  item,
  id,
  playingId,
  onTogglePlay,
  onPlayEnded,
  className,
}: {
  item: MessageAudioItem
  id: string
  playingId: string | null
  onTogglePlay: (audio: HTMLAudioElement) => void
  onPlayEnded: () => void
  className?: string
}) {
  const storageUrl = useQuery(
    api.recordings.getStorageUrl,
    item.storageId ? { storageId: item.storageId } : 'skip',
  )
  const playbackUrl = storageUrl ?? (item.url && isPlayableAudioUrl(item.url) ? item.url : null)

  if (!playbackUrl) {
    if (item.storageId || item.url) {
      return <AudioRecordingChipLoading className={className ?? 'w-full max-w-52'} />
    }
    return null
  }

  return (
    <AudioRecordingPlayer
      url={playbackUrl}
      id={id}
      playingId={playingId}
      className={className ?? 'w-full max-w-52'}
      onTogglePlay={onTogglePlay}
      onPlayEnded={onPlayEnded}
    />
  )
}

export function MessageAudioRecordings({
  items,
  variant = 'stacked',
}: {
  items: MessageAudioItem[]
  variant?: 'stacked' | 'chips'
}) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  const handleTogglePlay = (id: string, audio: HTMLAudioElement) => {
    if (playingId === id) {
      audio.pause()
      setPlayingId(null)
      return
    }
    audio.onended = () => setPlayingId(null)
    void audio.play()
    setPlayingId(id)
  }

  const playableItems = items.filter((item) => item.storageId || item.url)
  if (playableItems.length === 0) return null

  if (variant === 'chips') {
    return (
      <HorizontalScrollWithFade>
        {playableItems.map((item, index) => {
          const itemId = item.storageId ?? item.url ?? String(index)
          return (
            <MessageAudioRecordingItem
              key={`${itemId}-${index}`}
              id={`${itemId}-${index}`}
              item={item}
              playingId={playingId}
              className="w-44 shrink-0"
              onTogglePlay={(audio) => handleTogglePlay(`${itemId}-${index}`, audio)}
              onPlayEnded={() => setPlayingId(null)}
            />
          )
        })}
      </HorizontalScrollWithFade>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {playableItems.map((item, index) => {
        const itemId = item.storageId ?? item.url ?? String(index)
        return (
          <MessageAudioRecordingItem
            key={`${itemId}-${index}`}
            id={`${itemId}-${index}`}
            item={item}
            playingId={playingId}
            onTogglePlay={(audio) => handleTogglePlay(`${itemId}-${index}`, audio)}
            onPlayEnded={() => setPlayingId(null)}
          />
        )
      })}
    </div>
  )
}

function AudioAttachmentChip({
  file,
  playingId,
  isLoading,
  onTogglePlay,
  onPlayEnded,
  onRemove,
  className,
}: {
  file: { id: string; url: string }
  playingId: string | null
  isLoading?: boolean
  onTogglePlay: (audio: HTMLAudioElement) => void
  onPlayEnded: () => void
  onRemove: () => void
  className?: string
}) {
  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={enterTransition}
      className={cn('relative', className)}
    >
      {isLoading ? (
        <AudioRecordingChipLoading className="pr-7" showRemove onRemove={onRemove} />
      ) : (
        <>
          <AudioRecordingPlayer
            url={file.url}
            id={file.id}
            playingId={playingId}
            onTogglePlay={onTogglePlay}
            onPlayEnded={onPlayEnded}
            className="pr-7"
          />
          <Button
            aria-label="Remove recording"
            size="icon"
            type="button"
            variant="ghost"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </>
      )}
    </motion.div>
  )
}

interface AudioAttachmentPreviewProps {
  variant?: 'stacked' | 'header'
}

export function AudioAttachmentPreview({ variant = 'stacked' }: AudioAttachmentPreviewProps) {
  const attachments = usePromptInputAttachments()
  const { processingCount, uploadingIds } = useAudioRecordingStatus()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioFiles = attachments.files.filter((file) => file.mediaType?.startsWith('audio/'))
  const hasAudio = audioFiles.length > 0 || processingCount > 0

  const handleTogglePlay = (fileId: string, audio: HTMLAudioElement) => {
    if (playingId === fileId) {
      audio.pause()
      setPlayingId(null)
      return
    }
    audio.onended = () => setPlayingId(null)
    void audio.play()
    setPlayingId(fileId)
  }

  if (variant === 'header') {
    return (
      <div
        className={cn(
          'grid w-full self-start transition-[grid-template-rows] duration-300 ease-out',
          hasAudio ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <PromptInputHeader className="pb-1.5 pt-2">
            <HorizontalScrollWithFade>
              <div className="flex w-full items-center justify-start gap-1.5">
                <AnimatePresence mode="popLayout">
                  {Array.from({ length: processingCount }, (_, index) => (
                    <motion.div
                      key={`processing-${index}`}
                      layout={false}
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={enterTransition}
                      className="w-44 shrink-0"
                    >
                      <AudioRecordingChipLoading />
                    </motion.div>
                  ))}
                  {audioFiles.map((file) => (
                    <AudioAttachmentChip
                      key={file.id}
                      file={file}
                      playingId={playingId}
                      isLoading={uploadingIds.has(file.id)}
                      className="w-44 shrink-0"
                      onTogglePlay={(audio) => handleTogglePlay(file.id, audio)}
                      onPlayEnded={() => setPlayingId(null)}
                      onRemove={() => attachments.remove(file.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </HorizontalScrollWithFade>
          </PromptInputHeader>
        </div>
      </div>
    )
  }

  if (!hasAudio) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {audioFiles.map((file) => (
        <div key={file.id} className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MicIcon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">Recorded audio</div>
              <div className="text-xs text-muted-foreground">Ready to identify chords</div>
            </div>
          </div>
          <Button
            aria-label="Remove recording"
            size="icon"
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              attachments.remove(file.id)
            }}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
