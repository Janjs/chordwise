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
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Icons.info />
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
