'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { PlusIcon, PanelLeftIcon } from 'lucide-react'
import { useConvexAuth } from 'convex/react'
import { Icons } from '@/components/icons'
import { SidebarChatList } from '@/components/sidebar-chat-list'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (pathname === '/' && (isLoading || !isAuthenticated)) {
    return null
  }

  const handleNewChat = () => {
    router.push('/')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-muted data-[state=open]:text-foreground hover:bg-background "
            >
              <Link href="/" className="flex items-center min-h-12 ml-1">
                <div className="flex aspect-square items-center justify-center">
                  <Icons.mascot className="size-6.5" />
                </div>
                <div className="flex-1 text-left text-sm leading-tight">
                  <Icons.logo className="h-5 w-auto" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={toggleSidebar}>
                  <PanelLeftIcon className="size-4" />
                  <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed || isMobile}>
                {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={handleNewChat}>
                  <PlusIcon className="size-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed || isMobile}>
                New Chat
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {(isMobile || !isCollapsed) && (
        <SidebarContent>
          <Suspense fallback={null}>
            <SidebarChatList pathname={pathname} />
          </Suspense>
        </SidebarContent>
      )}
    </Sidebar>
  )
}
