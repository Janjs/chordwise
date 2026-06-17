'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trash2Icon, ChevronUp } from 'lucide-react'
import { useMutation, useConvexAuth, usePaginatedQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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

export function SidebarChatList({ pathname }: { pathname: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isMobile } = useSidebar()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const { signIn } = useAuthActions()

  const { results: chats, status, loadMore } = usePaginatedQuery(
    api.chats.list,
    isAuthenticated ? {} : 'skip',
    { initialNumItems: 20 }
  )
  const removeChat = useMutation(api.chats.remove)

  const currentChatId = searchParams.get('chatId')

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

  const handleSignIn = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  if (isAuthLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-muted-foreground text-center mb-2">
            Sign in to save your history
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignIn}>
                <span>Sign In</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (status === 'LoadingFirstPage') {
    return null
  }

  const groupedChats = groupChatsByDate(chats)

  return (
    <>
      {Object.entries(groupedChats).map(
        ([group, chatsInGroup]) =>
          chatsInGroup.length > 0 && (
            <Collapsible key={group} defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    {group}
                    <ChevronUp className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {chatsInGroup.map((chat) => (
                        <SidebarMenuItem key={chat._id}>
                          <SidebarMenuButton
                            asChild
                            isActive={currentChatId === chat._id}
                            tooltip={chat.title}
                            className={cn(
                              "group-has-[[data-sidebar=menu-action]]/menu-item:pr-2 group-has-[[data-sidebar=menu-action]]/menu-item:group-hover/menu-item:pr-8 duration-200",
                              isMobile && "group-has-[[data-sidebar=menu-action]]/menu-item:pr-8"
                            )}
                          >
                            <Link href={`/generate?chatId=${chat._id}&title=${encodeURIComponent(chat.title)}`}>
                              <span>{chat.title}</span>
                            </Link>
                          </SidebarMenuButton>
                          <SidebarMenuAction
                            onClick={(e) => handleDeleteChat(e, chat._id)}
                            className="group-hover/menu-item:opacity-100 md:opacity-0 hover:bg-destructive hover:text-destructive-foreground transition-opacity"
                          >
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">Delete</span>
                          </SidebarMenuAction>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
      )}
      {chats.length === 0 && (
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No chat history yet
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {status === 'CanLoadMore' && (
        <div className="p-4 flex justify-center">
          <SidebarMenuButton onClick={() => loadMore(20)} className='justify-center text-muted-foreground'>
            Load More
          </SidebarMenuButton>
        </div>
      )}
    </>
  )
}
