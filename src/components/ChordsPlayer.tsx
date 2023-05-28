"use client";

import { FC, useState } from "react";
import { Play, Pause, SkipBack, Download } from "lucide-react";
import { Chord } from "tonal";
import MidiPlayer from "./MidiPlayer";

interface ChordsPlayerProps {
  index: number;
  chordProgression: string[];
}

const PITCH = "4"

const ChordsPlayer: FC<ChordsPlayerProps> = (props) => {
  const { index, chordProgression } = props;
  const [playing, setPlaying] = useState(false);

  const chordsPitches = chordProgression.map((chord) => {
    const notes = Chord.get(chord).notes;

    const pitches: string[] = notes
      .map((note) => note + PITCH)
      .filter((note) => !!note);

    return pitches
  });

  const handlePlay = () => {
    setPlaying(true);
  };

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
      <MidiPlayer index={index} chords={chordsPitches} />
    </div>
  );
};

export default ChordsPlayer;
