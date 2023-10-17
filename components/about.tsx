import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function About() {
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-5">
            <Icons.info className="absolute rotate-90 scale-0 text-foreground transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          Welcome to Chordwise
          <AlertDialogFooter>
            <AlertDialogCancel>close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
