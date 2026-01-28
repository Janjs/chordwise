'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PlusIcon, PanelLeftIcon, Trash2Icon } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function groupChatsByDate(
  chats: Array<{ _id: Id<'chats'>; title: string; updatedAt: number }>
) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const groups: Record<string, typeof chats> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Last 30 days': [],
    Older: [],
  }

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt)
    if (chatDate >= today) {
      groups.Today.push(chat)
    } else if (chatDate >= yesterday) {
      groups.Yesterday.push(chat)
    } else if (chatDate >= lastWeek) {
      groups['Last 7 days'].push(chat)
    } else if (chatDate >= lastMonth) {
      groups['Last 30 days'].push(chat)
    } else {
      groups.Older.push(chat)
    }
  }

  return groups
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const chats = useQuery(api.chats.list)
  const removeChat = useMutation(api.chats.remove)

  const currentChatId = searchParams.get('chatId')

  const handleNewChat = () => {
    router.push('/')
  }

  const handleDeleteChat = async (
    e: React.MouseEvent,
    chatId: Id<'chats'>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    await removeChat({ id: chatId })
    if (currentChatId === chatId) {
      router.push('/')
    }
  }

  const groupedChats = chats ? groupChatsByDate(chats) : null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-muted data-[state=open]:text-foreground"
            >
              <Link href="/" className="flex items-center min-h-15">
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

      {!isCollapsed && (
        <SidebarContent>
          {groupedChats &&
            Object.entries(groupedChats).map(
              ([group, chatsInGroup]) =>
                chatsInGroup.length > 0 && (
                  <SidebarGroup key={group}>
                    <SidebarGroupLabel>{group}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {chatsInGroup.map((chat) => (
                          <SidebarMenuItem key={chat._id}>
                            <SidebarMenuButton
                              asChild
                              isActive={currentChatId === chat._id}
                              tooltip={chat.title}
                            >
                              <Link href={`/generate?chatId=${chat._id}`}>
                                <Icons.music className="size-4" />
                                <span>{chat.title}</span>
                              </Link>
                            </SidebarMenuButton>
                            <SidebarMenuAction
                              showOnHover
                              onClick={(e) => handleDeleteChat(e, chat._id)}
                            >
                              <Trash2Icon className="size-4" />
                              <span className="sr-only">Delete</span>
                            </SidebarMenuAction>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )
            )}
          {chats && chats.length === 0 && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No chat history yet
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      )}
    </Sidebar>
  )
}
