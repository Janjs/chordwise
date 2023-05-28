"use client";

import { FC, MouseEventHandler, useRef, useState } from "react";
import { Play, Pause, SkipBack, Download } from "lucide-react";
import MIDISounds, { MIDISoundsMethods } from 'midi-sounds-react';
import { Midi, Chord } from "tonal";

interface ChordsPlayerProps {
  chordProgression: string[];
}

const ChordsPlayer: FC<ChordsPlayerProps> = (props) => {
  const { chordProgression } = props;
  const [playing, setPlaying] = useState(false);

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null);

  const notes = Chord.get("Cmaj7").notes;
  console.log(notes);
  const pitches: number[] = notes.map((note) => Midi.toMidi(note+"4") as number).filter(note => !!note);
  console.log(pitches);

  const playTestInstrument = () => {
    if (midiSoundsRef.current) {
      midiSoundsRef.current.playChordNow(4, pitches, 2.5);
    }
  };

  const handlePlay = () => {
    setPlaying(true)
    playTestInstrument()
  }
  

  return (
    <div className="flex flex-row items-center rounded-lg px-10 mb-4 bg-muted p-4 gap-10 [&>svg]:text-foreground">
      {!playing ? (
        <Play onClick={() => handlePlay()} />
      ) : (
        <Pause onClick={() => setPlaying(false)} />
      )}
      <SkipBack />
      <div className="flex-1 columns-4 rounded-lg gap-4 [&>svg]:text-foreground">
        {chordProgression.map((chord, i) => (
          <h1
            key={i}
            className="border rounded-lg aspect-square flex justify-center items-center bg-background p-2"
          >
            {chord}
          </h1>
        ))}
      </div>
      <Download />
      <div className="hidden">
        <MIDISounds ref={midiSoundsRef} instruments={[4]} />
      </div>
      <hr />
    </div>
  );
};

export default ChordsPlayer;
