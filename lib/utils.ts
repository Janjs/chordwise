import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type SharpMusicalKey = 'A#' | 'C#' | 'D#' | 'F#' | 'G#'
type FlatMusicalKey = 'Bb' | 'Eb' | 'Ab' | 'Db' | 'Gb' | 'Cb'
type GuitarSvgSharpAndFlatKey = 'C#' | 'Eb' | 'F#' | 'Ab' | 'Bb'

export type MusicalKey = SharpMusicalKey | FlatMusicalKey

const musicalKeyMapper: Record<MusicalKey, GuitarSvgSharpAndFlatKey> = {
  'A#': 'Bb',
  'C#': 'C#',
  'D#': 'Eb',
  'F#': 'F#',
  'G#': 'Ab',
  Bb: 'Bb',
  Eb: 'Eb',
  Ab: 'Ab',
  Db: 'Eb',
  Gb: 'F#',
  Cb: 'Bb',
}

export const mapMusicalKeyToGuitarSvg = (key: MusicalKey): GuitarSvgSharpAndFlatKey => musicalKeyMapper[key] || key

const NOTES_PER_OCTAVE = 12

export const convertToPitch = (midi: number, pitch: number): number => midi + pitch * NOTES_PER_OCTAVE
