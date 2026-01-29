'use client'

import { FC, useEffect, useRef, useMemo, useLayoutEffect, useState, useCallback } from 'react'
import { InstrumentContainerProps } from '../player/instrument-container'

const CHORDS_PER_VIEW = 4
const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const LEFT_MARGIN = 32
const NOTE_ROW_HEIGHT = 20
const TIMELINE_HEIGHT = 24

// Range: C0 (12) to B5 (83) = 6 octaves
const MIN_MIDI = 12
const MAX_MIDI = 83
const NOTE_RANGE = MAX_MIDI - MIN_MIDI + 1

const midiToNoteName = (midi: number): string => {
    const noteName = NOTE_LABELS[midi % 12]
    const octave = Math.floor(midi / 12) - 1
    return `${noteName}${octave}`
}

const MidiVisualizer: FC<InstrumentContainerProps> = (props) => {
    const { chordProgression, indexCurrentChord, pitch, tempo, isCurrentlyPlaying } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolledRef = useRef(false)


    // Animation state
    const animationRef = useRef<number | null>(null)
    const chordStartTimeRef = useRef<number | null>(null)
    const lastChordIndexRef = useRef<number>(-1)
    const [playheadProgress, setPlayheadProgress] = useState(0) // 0 to 1 within current chord

    // Track theme changes to trigger redraw
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'))

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDark(document.documentElement.classList.contains('dark'))
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })
        return () => observer.disconnect()
    }, [])

    // Calculate note events
    const noteEvents = useMemo(() => {
        const events: Array<{
            midi: number
            startTime: number
            duration: number
            chordIndex: number
        }> = []

        chordProgression.chords.forEach((chord, chordIndex) => {
            if (chord.midi) {
                chord.midi.forEach((midiNote) => {
                    const adjustedMidi = midiNote + (pitch || 0) // Pitch is in semitones
                    // Only show notes within the visible range
                    if (adjustedMidi >= MIN_MIDI && adjustedMidi <= MAX_MIDI) {
                        events.push({
                            midi: adjustedMidi,
                            startTime: chordIndex,
                            duration: 1,
                            chordIndex,
                        })
                    }
                })
            }
        })

        return events
    }, [chordProgression, pitch])

    // Refs for animation loop to access latest props without re-triggering effect
    const indexCurrentChordRef = useRef(indexCurrentChord)
    const tempoRef = useRef(tempo)

    // Update refs on every render
    indexCurrentChordRef.current = indexCurrentChord
    tempoRef.current = tempo

    // Animation loop for smooth playhead
    useEffect(() => {
        if (!isCurrentlyPlaying) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
            chordStartTimeRef.current = null
            if (indexCurrentChord < 0) {
                setPlayheadProgress(0)
            }
            return
        }

        // Force a reset if we are just starting/resuming
        // This ensures visualizer syncs with audio player which restarts chord on resume
        if (chordStartTimeRef.current === null) {
            lastChordIndexRef.current = -1
        }

        const animate = () => {
            const currentChordIndex = indexCurrentChordRef.current
            const currentTempo = tempoRef.current

            // Reset when chord changes
            if (currentChordIndex !== lastChordIndexRef.current) {
                chordStartTimeRef.current = performance.now()
                lastChordIndexRef.current = currentChordIndex
                setPlayheadProgress(0)
            }

            if (!chordStartTimeRef.current) {
                chordStartTimeRef.current = performance.now()
            }

            // The player logic uses whole notes (4 beats) for each chord transition
            // wholeNoteDuration = (4 * 60) / bpm
            const msPerChord = ((4 * 60) / currentTempo) * 1000
            const elapsed = performance.now() - chordStartTimeRef.current
            const progress = Math.min(elapsed / msPerChord, 1)

            setPlayheadProgress(progress)

            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
        }
    }, [isCurrentlyPlaying]) // Only re-run if play status changes

    // Function to scroll to center on the actual notes
    const scrollToNotes = useCallback(() => {
        const scrollContainer = scrollRef.current
        if (!scrollContainer || noteEvents.length === 0) return

        // Find the min and max MIDI notes that are actually used
        const midiValues = noteEvents.map(e => e.midi)
        const minNote = Math.min(...midiValues)
        const maxNote = Math.max(...midiValues)

        // Calculate Y positions using same formula as canvas drawing
        const noteAreaHeight = NOTE_RANGE * NOTE_ROW_HEIGHT
        const minRowIndex = minNote - MIN_MIDI
        const maxRowIndex = maxNote - MIN_MIDI

        // Y coordinates (higher notes = lower Y value, i.e. top of canvas)
        const topY = noteAreaHeight - ((maxRowIndex + 1) * NOTE_ROW_HEIGHT)
        const bottomY = noteAreaHeight - (minRowIndex * NOTE_ROW_HEIGHT)
        const centerY = (topY + bottomY) / 2

        // Scroll so that centerY is in the middle of the viewport
        const targetScroll = centerY - (scrollContainer.clientHeight / 2)
        scrollContainer.scrollTop = Math.max(0, targetScroll)
    }, [noteEvents])

    // Scroll to center on notes when component loads
    useEffect(() => {
        if (!hasScrolledRef.current && noteEvents.length > 0) {
            // Use a small delay to ensure canvas is rendered
            const timer = setTimeout(() => {
                scrollToNotes()
                hasScrolledRef.current = true
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [noteEvents, scrollToNotes])

    // Auto-scroll horizontally to keep current chord visible
    useEffect(() => {
        const scrollContainer = scrollRef.current
        if (!scrollContainer) return

        const totalChords = chordProgression.chords.length
        const containerWidth = scrollContainer.clientWidth
        const chordWidth = (containerWidth - LEFT_MARGIN) / CHORDS_PER_VIEW

        if (totalChords > CHORDS_PER_VIEW) {
            const targetX = (indexCurrentChord * chordWidth) - (containerWidth / 2) + LEFT_MARGIN
            scrollContainer.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' })
        }
    }, [indexCurrentChord, chordProgression.chords.length])

    const [containerWidth, setContainerWidth] = useState(0)

    // Handle resizing
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    // Canvas drawing
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container || containerWidth === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Get computed styles for theme colors
        const computedStyle = getComputedStyle(document.documentElement)
        const bgColor = computedStyle.getPropertyValue('--color-card').trim()
        const borderColor = computedStyle.getPropertyValue('--color-border').trim()
        const mutedColor = computedStyle.getPropertyValue('--color-muted').trim()
        const mutedFgColor = computedStyle.getPropertyValue('--color-muted-foreground').trim()
        const primaryColor = computedStyle.getPropertyValue('--color-primary').trim()
        const foregroundColor = computedStyle.getPropertyValue('--color-foreground').trim()

        const dpr = window.devicePixelRatio || 1
        const totalChords = chordProgression.chords.length

        const chordWidth = (containerWidth - LEFT_MARGIN) / CHORDS_PER_VIEW
        const width = LEFT_MARGIN + (chordWidth * Math.max(totalChords, CHORDS_PER_VIEW))
        const noteAreaHeight = NOTE_RANGE * NOTE_ROW_HEIGHT
        const height = noteAreaHeight

        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(dpr, dpr)

        // Background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)

        // Alternating row backgrounds
        for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
            const rowIndex = midi - MIN_MIDI
            const y = noteAreaHeight - ((rowIndex + 1) * NOTE_ROW_HEIGHT)
            if (rowIndex % 2 === 0) {
                ctx.fillStyle = mutedColor
                ctx.fillRect(LEFT_MARGIN, y, width - LEFT_MARGIN, NOTE_ROW_HEIGHT)
            }
        }

        // Vertical bar lines
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 1
        for (let i = 0; i <= Math.max(totalChords, CHORDS_PER_VIEW); i++) {
            const x = LEFT_MARGIN + (i * chordWidth)
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, noteAreaHeight)
            ctx.stroke()
        }

        // Note labels
        ctx.fillStyle = mutedFgColor
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
            const rowIndex = midi - MIN_MIDI
            const y = noteAreaHeight - ((rowIndex + 0.5) * NOTE_ROW_HEIGHT)
            ctx.fillText(midiToNoteName(midi), LEFT_MARGIN - 4, y)
        }

        // Notes
        noteEvents.forEach(event => {
            const padding = 2
            const x = LEFT_MARGIN + (event.startTime * chordWidth) + padding
            const noteWidth = chordWidth - (padding * 2)
            const rowIndex = event.midi - MIN_MIDI
            const y = noteAreaHeight - ((rowIndex + 1) * NOTE_ROW_HEIGHT) + padding
            const rectHeight = NOTE_ROW_HEIGHT - (padding * 2)
            const isPlaying = event.chordIndex === indexCurrentChord

            if (isPlaying) {
                ctx.fillStyle = primaryColor
            } else if (event.chordIndex < indexCurrentChord) {
                ctx.fillStyle = mutedFgColor
                ctx.globalAlpha = 0.5
            } else {
                ctx.fillStyle = foregroundColor
            }

            const radius = Math.min(rectHeight / 3, 4)
            ctx.beginPath()
            ctx.roundRect(x, y, noteWidth, rectHeight, radius)
            ctx.fill()
            ctx.globalAlpha = 1
        })

        // Playhead - now animated within the chord based on playheadProgress
        const playheadX = LEFT_MARGIN + (indexCurrentChord * chordWidth) + (playheadProgress * chordWidth)
        ctx.strokeStyle = primaryColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(playheadX, 0)
        ctx.lineTo(playheadX, noteAreaHeight)
        ctx.stroke()

    }, [noteEvents, indexCurrentChord, chordProgression.chords.length, isDark, playheadProgress, containerWidth])

    const totalChords = chordProgression.chords.length

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
            >
                <canvas ref={canvasRef} className="block" />
            </div>

            {/* Chord count bar - fixed at bottom */}
            <div
                className="flex-shrink-0 bg-muted border-t border-border"
                style={{ height: TIMELINE_HEIGHT, paddingLeft: LEFT_MARGIN }}
            >
                <div className="flex h-full">
                    {Array.from({ length: Math.max(totalChords, CHORDS_PER_VIEW) }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground"
                        >
                            {i < totalChords ? i + 1 : ''}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MidiVisualizer
