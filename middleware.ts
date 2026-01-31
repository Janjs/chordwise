import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'

export default convexAuthNextjsMiddleware()

export const config = {
  // Exclude /api/auth/signin/* and /api/auth/callback/* from middleware - they have their own route handlers
  matcher: [
    '/((?!.*\\..*|_next|api/auth/signin|api/auth/callback).*)',
    '/',
    '/(api(?!/auth/signin|/auth/callback)|trpc)(.*)',
  ],
}
