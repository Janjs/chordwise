'use client'

import { FC, useEffect, useRef, useMemo, useLayoutEffect } from 'react'
import { InstrumentContainerProps } from '../player/instrument-container'

const CHORDS_PER_VIEW = 4
const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const LEFT_MARGIN = 32
const NOTE_ROW_HEIGHT = 20
const TIMELINE_HEIGHT = 24

// Range: C0 (12) to B5 (83) = 6 octaves
const MIN_MIDI = 12
const MAX_MIDI = 83

const midiToNoteName = (midi: number): string => {
    const noteName = NOTE_LABELS[midi % 12]
    const octave = Math.floor(midi / 12) - 1
    return `${noteName}${octave}`
}

const MidiVisualizer: FC<InstrumentContainerProps> = (props) => {
    const { chordProgression, indexCurrentChord, pitch } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolledRef = useRef(false)

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
                    const adjustedMidi = midiNote + (pitch || 0)
                    const clampedMidi = Math.max(MIN_MIDI, Math.min(MAX_MIDI, adjustedMidi))
                    events.push({
                        midi: clampedMidi,
                        startTime: chordIndex,
                        duration: 1,
                        chordIndex,
                    })
                })
            }
        })

        return events
    }, [chordProgression, pitch])

    // Scroll to bottom on initial render - use useLayoutEffect for synchronous execution
    useLayoutEffect(() => {
        if (hasScrolledRef.current) return
        const scrollContainer = scrollRef.current
        if (!scrollContainer) return

        // Force layout calculation then scroll
        const scrollToBottom = () => {
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight
            if (maxScroll > 0) {
                scrollContainer.scrollTop = maxScroll
                hasScrolledRef.current = true
            }
        }

        // Try immediately
        scrollToBottom()

        // Also try after a short delay in case canvas hasn't rendered yet
        const timeoutId = setTimeout(scrollToBottom, 50)
        return () => clearTimeout(timeoutId)
    }, [])

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

    // Canvas drawing
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const bgColor = '#0c1f25'
        const gridColor = '#1a3a45'
        const gridLineColor = '#2a5060'
        const labelColor = '#6a8a94'
        const noteColor = '#5fbcd3'
        const activeNoteColor = '#7ed6ec'
        const pastNoteColor = '#3a6a78'

        const dpr = window.devicePixelRatio || 1
        const totalChords = chordProgression.chords.length
        const noteRange = MAX_MIDI - MIN_MIDI + 1

        const containerRect = container.getBoundingClientRect()
        const chordWidth = (containerRect.width - LEFT_MARGIN) / CHORDS_PER_VIEW
        const width = LEFT_MARGIN + (chordWidth * Math.max(totalChords, CHORDS_PER_VIEW))
        const noteAreaHeight = noteRange * NOTE_ROW_HEIGHT
        const height = noteAreaHeight

        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(dpr, dpr)

        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)

        // Alternating row backgrounds
        for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
            const rowIndex = midi - MIN_MIDI
            const y = noteAreaHeight - ((rowIndex + 1) * NOTE_ROW_HEIGHT)
            if (rowIndex % 2 === 0) {
                ctx.fillStyle = gridColor
                ctx.fillRect(LEFT_MARGIN, y, width - LEFT_MARGIN, NOTE_ROW_HEIGHT)
            }
        }

        // Vertical bar lines
        ctx.strokeStyle = gridLineColor
        ctx.lineWidth = 1
        for (let i = 0; i <= Math.max(totalChords, CHORDS_PER_VIEW); i++) {
            const x = LEFT_MARGIN + (i * chordWidth)
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, noteAreaHeight)
            ctx.stroke()
        }

        // Note labels
        ctx.fillStyle = labelColor
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
            const rowIndex = midi - MIN_MIDI
            const y = noteAreaHeight - ((rowIndex + 0.5) * NOTE_ROW_HEIGHT)
            const noteInOctave = midi % 12
            if ([0, 2, 4, 5, 7, 9, 11].includes(noteInOctave)) {
                ctx.fillText(midiToNoteName(midi), LEFT_MARGIN - 4, y)
            }
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
                ctx.fillStyle = activeNoteColor
                ctx.shadowBlur = 12
                ctx.shadowColor = activeNoteColor
            } else if (event.chordIndex < indexCurrentChord) {
                ctx.fillStyle = pastNoteColor
                ctx.shadowBlur = 0
            } else {
                ctx.fillStyle = noteColor
                ctx.shadowBlur = 0
            }

            const radius = Math.min(rectHeight / 3, 4)
            ctx.beginPath()
            ctx.roundRect(x, y, noteWidth, rectHeight, radius)
            ctx.fill()
            ctx.shadowBlur = 0
        })

        // Playhead
        const playheadX = LEFT_MARGIN + (indexCurrentChord * chordWidth) + chordWidth / 2
        ctx.strokeStyle = activeNoteColor
        ctx.lineWidth = 2
        ctx.shadowBlur = 8
        ctx.shadowColor = activeNoteColor
        ctx.beginPath()
        ctx.moveTo(playheadX, 0)
        ctx.lineTo(playheadX, noteAreaHeight)
        ctx.stroke()
        ctx.shadowBlur = 0

    }, [noteEvents, indexCurrentChord, chordProgression.chords.length])

    const totalChords = chordProgression.chords.length

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden">
            {/* Note grid - only this scrolls vertically */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
            >
                <canvas ref={canvasRef} className="block" />
            </div>

            {/* Timeline - fixed at bottom */}
            <div
                className="flex-shrink-0 bg-[#1a3a45] border-t border-[#2a5060]"
                style={{ height: TIMELINE_HEIGHT, paddingLeft: LEFT_MARGIN }}
            >
                <div className="flex h-full">
                    {Array.from({ length: Math.max(totalChords, CHORDS_PER_VIEW) }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 flex items-center justify-center text-[10px] text-[#6a8a94]"
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
