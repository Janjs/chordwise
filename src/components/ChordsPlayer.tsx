"use client";

import { FC, useState } from "react";
import { Play, Pause, SkipBack, Download } from "lucide-react";

interface ChordsPlayerProps {
  chordProgression: string[];
}

const ChordsPlayer: FC<ChordsPlayerProps> = (props) => {
  const { chordProgression } = props;

  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-row items-center rounded-lg px-10 mb-4 bg-muted p-4 gap-10 [&>svg]:text-foreground">
      {!playing ? (
        <Play onClick={() => setPlaying(true)} />
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
    </div>
  );
};

export default ChordsPlayer;
