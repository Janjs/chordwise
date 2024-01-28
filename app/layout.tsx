import Header from './header'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from './footer'
import Head from 'next/head'

export const metadata = {
  title: 'Chordwise',
  description: 'Chords Progressions AI Generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.className}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* other head elements */}
      </Head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen flex-col">
            <div className="flex-none">
              <Header />
            </div>
            <div className="flex flex-1 justify-center overflow-auto">{children}</div>
            <div className="hidden md:flex flex-col justify-items-end">
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
