/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const convexBackendUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://backend.chordwise.janjs.dev'
    return [
      {
        source: '/api/auth/signin/:path*',
        destination: `${convexBackendUrl}/http/api/auth/signin/:path*`,
      },
      {
        source: '/api/auth/callback/:path*',
        destination: `${convexBackendUrl}/http/api/auth/callback/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
