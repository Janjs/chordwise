import { NextRequest, NextResponse } from 'next/server'

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

  // If the backend returns a redirect, pass it through
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')
    if (location) {
      return NextResponse.redirect(location)
    }
  }

  // Pass through the response
  const body = await response.text()
  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'text/html',
    },
  })
}
