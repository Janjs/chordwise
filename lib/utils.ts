import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const GITHUB_LINK = 'https://github.com/Janjs'
export const TWITTER_LINK = 'https://x.com/Janjijs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NOTES_PER_OCTAVE = 12
export const convertToPitch = (midi: number, pitch: number): number => midi + pitch * NOTES_PER_OCTAVE
