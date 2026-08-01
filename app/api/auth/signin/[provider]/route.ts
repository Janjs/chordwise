import { NextRequest, NextResponse } from 'next/server'
import { rewriteCookieForFrontend } from '@/lib/auth-cookie-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const convexBackendUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://backend.chordwise.janjs.dev'
  const targetUrl = `${convexBackendUrl}/http/api/auth/signin/${provider}${request.nextUrl.search}`

  console.log('Proxying signin request to:', targetUrl)

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'manual',
  })

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')
    if (location) {
      const redirectResponse = NextResponse.redirect(location)
      const setCookies = response.headers.getSetCookie?.() ?? []
      for (const cookie of setCookies) {
        const rewrittenCookie = rewriteCookieForFrontend(cookie)
        redirectResponse.headers.append('Set-Cookie', rewrittenCookie)
      }
      return redirectResponse
    }
  }

  const body = await response.text()
  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'text/html',
    },
  })

  const setCookies = response.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    const rewrittenCookie = rewriteCookieForFrontend(cookie)
    nextResponse.headers.append('Set-Cookie', rewrittenCookie)
  }

  return nextResponse
}
