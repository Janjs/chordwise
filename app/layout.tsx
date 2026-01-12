import Header from './header'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from './footer'

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
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="h-[100dvh] relative flex flex-col">
            <div className="absolute top-0 left-3 right-0 z-10 bg-transparent">
              <Header />
            </div>
            <div className="flex flex-1 justify-center overflow-auto py-4">{children}</div>
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
