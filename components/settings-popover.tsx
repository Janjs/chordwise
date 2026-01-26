'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { useTheme } from 'next-themes'
import { DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import About from '@/components/about'

export default function SettingsPopover() {
  const { setTheme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icons.settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1.5">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme('light')}>
              <Icons.sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme('dark')}>
              <Icons.moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme('system')}>
              <Icons.laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </Button>
          </div>
          <div className="px-2 py-1.5">
            <About />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
