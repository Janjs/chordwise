import { Suspense } from 'react'
import Header from './header'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata = {
  title: 'Chordwise',
  description: 'Chords Progressions AI Generator',
  content: 'width=device-width, initial-scale=1',
  name: 'viewport',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.className}>
      <head>
        {/* <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        /> */}
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="h-[100dvh] flex flex-col">
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <div className="flex flex-1 overflow-hidden">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
