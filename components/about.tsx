import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GITHUB_LINK, TWITTER_LINK } from '@/lib/utils'

interface AboutProps {
  variant?: 'default' | 'icon'
}

export default function About({ variant = 'default' }: AboutProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon">
            <Icons.info className="h-4 w-4" />
          </Button>
        ) : (
          <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground hover:bg-accent hover:text-accent-foreground w-full">
            <Icons.info className="h-4 w-4" />
            <span>About</span>
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-medium">Welcome to Chordwise🎵✨</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-md space-y-2">
          <p>
            Chordwise is <b className="font-bold">chord progression generator</b> powered by{' '}
            <b className="font-bold">AI</b>.
          </p>
          <p className="font-light">
            Whether you're a <b className="font-bold">songwriter📝</b> in search of fresh ideas to create your next
            hit song or a <b className="font-bold">guitar soloist🎸</b> looking for the perfect backing track to
            unleash your shredding skills, Chordwise is here to{' '}
            <b className="font-bold">enhance, not replace, your musical creativity🎨.</b>
          </p>
          <p className="font-light"></p>
          <p className="font-light">
            Simply input a description and select a musical key (or leave it blank), and Chordwise will effortlessly
            generate chord progressions that perfectly match the given description.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          💻 Made by
          <a href={TWITTER_LINK} target="_blank" className="mb-10 underline underline-offset-4">
            {' '}
            @Janjs.
          </a>
        </p>
        <AlertDialogFooter>
          <div className="hidden sm:flex">
            <a href={GITHUB_LINK}>
              <Button variant="ghost" size="icon">
                <Icons.gitHub className="w-4 h-4 inline" />
              </Button>
            </a>
            <a href={TWITTER_LINK}>
              <Button variant="ghost" size="icon">
                <Icons.twitter className="w-4 h-4 inline" />
              </Button>
            </a>
          </div>
          <AlertDialogCancel>close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
