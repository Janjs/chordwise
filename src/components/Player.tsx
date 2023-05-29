"use client";

import { FC } from "react";
import { ChordProgression } from "@/types/types";
import ChordProgressionViewer from "./ChordProgressionViewer";

interface PlayerProps {
  chordProgressions: ChordProgression[];
}

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props;

  return (
    <>
      <ul>
        {chordProgressions.map((chordProgression, index) => (
          <li key={index} className="">
            <ChordProgressionViewer
              index={index}
              chordProgression={chordProgression.chords}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Player;
