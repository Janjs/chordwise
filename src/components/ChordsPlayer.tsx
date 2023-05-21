"use client";

import { FC, useState } from "react";
import { Play } from "lucide-react";

interface ChordsPlayerProps {
  chordProgression: string[];
}

const ChordsPlayer: FC<ChordsPlayerProps> = (props) => {
  const { chordProgression } = props;

  return (
    <div className="flex flex-row items-center rounded-lg mb-4 bg-muted p-4 [&>svg]:text-foreground">
      <Play className="mr-4" />
      <div className="flex-1 columns-4 rounded-lg gap-4 [&>svg]:text-foreground">
        {chordProgression.map((chord) => (
          <h1 className="border rounded-lg aspect-square flex justify-center items-center bg-background">
            {chord}
          </h1>
        ))}
      </div>
    </div>
  );
};

export default ChordsPlayer;
