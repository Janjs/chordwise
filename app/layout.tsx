import Header from './header'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from './footer'

export const metadata = {
  title: 'Chordwise',
  description: 'Chords progressions AI generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.className}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange // TODO: doesn't work
        >
          <div className="flex h-screen flex-col">
            <div className="flex-none">
              <Header />
            </div>
            <div className="flex flex-1 justify-center overflow-auto">{children}</div>
            <div className="flex-none">
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
