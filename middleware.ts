import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const authMiddleware = convexAuthNextjsMiddleware()

export default async function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl

  // Proxy /api/auth/signin/* and /api/auth/callback/* to Convex backend
  if (pathname.startsWith('/api/auth/signin/') || pathname.startsWith('/api/auth/callback/')) {
    const convexBackendUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://backend.chordwise.janjs.dev'
    const targetUrl = new URL(`${convexBackendUrl}/http${pathname}${request.nextUrl.search}`)
    return NextResponse.rewrite(targetUrl)
  }

  // For all other routes, use the convex auth middleware
  return authMiddleware(request, event)
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
