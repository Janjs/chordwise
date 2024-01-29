import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TwitterIcon, X } from 'lucide-react'

export default function About() {
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="h-10 w-10">
            <Icons.info className="absolute scale-100" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <h1 className="text-xl font-medium">Welcome to Chordwise🎵✨</h1>
          <div className="text-md space-y-2">
            <p>
              Chordwise is <b className="font-bold">chord progression generator</b> powered by{' '}
              <b className="font-bold">AI</b>
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
            <a href="https://x.com/Janjijs" target="_blank" className="mb-10 underline underline-offset-4">
              {' '}
              @Janjs.
            </a>
          </p>
          <AlertDialogFooter>
            <div className="hidden sm:flex">
              <a href="https://github.com/Janjs">
                <Button variant="ghost" size="icon">
                  <Icons.gitHub className="w-4 h-4 inline" />
                </Button>
              </a>
              <a href="https://x.com/Janjijs">
                <Button variant="ghost" size="icon">
                  <Icons.twitter className="w-4 h-4 inline" />
                </Button>
              </a>
            </div>
            <AlertDialogCancel>close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
