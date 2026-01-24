'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Progression } from '@/types/types'
import MidiWriter from 'midi-writer-js'

interface MidiExportButtonProps {
    chordProgression: Progression
    pitch?: number
    tempo?: number
}

const MidiExportButton: FC<MidiExportButtonProps> = ({
    chordProgression,
    pitch = 0,
    tempo = 120
}) => {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)

            // Create a new track
            const track = new MidiWriter.Track()

            // Set tempo
            track.setTempo(tempo)

            // Add notes for each chord
            chordProgression.chords.forEach((chord) => {
                if (chord.midi && chord.midi.length > 0) {
                    // Apply pitch offset and ensure notes are valid
                    // midi-writer-js accepts midi numbers or note names. 
                    // Since we have midi numbers, we can use them directly if we assume they map correctly,
                    // but midi-writer-js might expect specific format or arrays.
                    // Checking docs/examples: track.addEvent(new MidiWriter.NoteEvent({pitch: [60, 64, 67], duration: '4'}));

                    const adjustedMidi = chord.midi.map(note => note + pitch)

                    track.addEvent(new MidiWriter.NoteEvent({
                        pitch: adjustedMidi,
                        duration: '1', // Whole note (4 beats) per chord as per visualizer logic
                        velocity: 80 // Default velocity
                    }))
                } else {
                    // Add a rest if no notes
                    track.addEvent(new MidiWriter.NoteEvent({
                        pitch: [],
                        duration: '1',
                        wait: '1' // Wait duration
                    }))
                }
            })

            // Generate the file
            const write = new MidiWriter.Writer(track)
            const dataUri = write.dataUri()

            // Trigger download
            const link = document.createElement('a')
            link.href = dataUri
            link.download = `chord-progression.mid`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Failed to export MIDI:', error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
        >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export MIDI'}
        </Button>
    )
}

export default MidiExportButton
