"use client"

import Image from 'next/image';
import logo from '@/assets/logo.svg';
import { useTheme } from 'next-themes'

export default function Header() {
  const { theme, setTheme } = useTheme()
  
  return (
    <header className="bg-transparent">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8"
        aria-label="Global"
      >
        <div className="flex flex-1 justify-start">
        <Image
          priority
          src={logo}
          width={120}
          alt="chordwise logo"
        />
        </div>
        <div className="flex flex-1 justify-end">
          <h1>Chords progressions AI generator.</h1>
        </div>
        <div>
      The current theme is: {theme}
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
      </nav>
    </header>
  );
}
