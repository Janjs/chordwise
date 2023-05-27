"use client"

import Image from 'next/image'
import { useTheme } from 'next-themes'
import logoLight from "./logo-light.svg";
import logoDark from "./logo-dark.svg";

function ThemedLogo() {
  const { resolvedTheme } = useTheme()
  let src

  switch (resolvedTheme) {
    case 'light':
      src = logoLight
      break
    case 'dark':
      src = logoDark
      break
    default:
      src = logoLight
      break
  }

  return <Image priority src={src} width={120} alt="chordwise logo" />
}

export default ThemedLogo