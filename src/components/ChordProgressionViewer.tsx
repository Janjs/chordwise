"use client";

import { FC, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import MIDISounds, { MIDISoundsMethods } from "midi-sounds-react";
import { Midi, Chord } from "tonal";

interface ChordProgressionViewerProps {
  index: number;
  chordProgression: string[];
}

const PITCH = "4";
const BPM = 100;

const ChordProgressionViewer: FC<ChordProgressionViewerProps> = (props) => {
  const { chordProgression } = props;
  const [playing, setPlaying] = useState(false);
  const [chordPlaying, setChordPlaying] = useState<number>(-1);
  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null);

  const chordsPitches = chordProgression.map((chord) => {
    const notes = Chord.get(chord).notes;

    const pitches: number[] = notes
      .map((note) => Midi.toMidi(note + PITCH) as number)
      .filter((note) => !!note);

    return pitches;
  });

  const playChordProgression = () => {
    const millisecondsPerBeat = 60000 / BPM; // Calculate the duration of each beat in milliseconds
    let i = 0;

    const playNextChord = () => {
      if (i < chordsPitches.length) {
        const chordPitches = chordsPitches[i];
        // Play each chord
        setChordPlaying(i)
        midiSoundsRef.current?.playChordNow(4, chordPitches, 1);
        
        i++;
        setTimeout(playNextChord, millisecondsPerBeat);
      } else {
        setChordPlaying(-1)
        setPlaying(false)
      }
    }
    playNextChord();
  }

  const handlePlay = () => {
    setPlaying(true);
    playChordProgression()
  };

  const isChordPlaying = (i: number) => i === chordPlaying

  return (
    <div className="flex flex-row items-center rounded-lg px-10 mb-4 p-4 gap-10 bg-muted hover:bg-primary [&>svg]:text-foreground hover:[&>svg]:text-background" onClick={() => handlePlay()}>
      <div className="flex-1 columns-4 rounded-lg gap-4">
        {chordProgression.map((chord, i) => (
          <h1
            key={i}
            className={`transition-colors border rounded-lg aspect-square flex justify-center items-center ${isChordPlaying(i) ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'} p-2`}
          >
            {chord}
          </h1>
        ))}
      </div>
      <div className="hidden">
        <MIDISounds ref={midiSoundsRef} instruments={[4]} />
      </div>
    </div>
  );
};

export default ChordProgressionViewer;
