import Header from './header'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from './footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Chordwise',
  description: 'Chords progressions AI generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
        >
          <div className='flex flex-col h-screen'>
            <div className='flex-none'>
              <Header />
            </div>
            <div className='flex-1 overflow-auto flex justify-center'>
              {children}
            </div>
            <div className='flex-none'>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
