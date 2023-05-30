"use client";

import { FC, useRef, useState } from "react";
import { ChordProgression } from "@/types/types";
import ChordProgressionViewer from "./ChordProgressionViewer";
import MIDISounds, { MIDISoundsMethods } from "midi-sounds-react";
import { Midi, Chord } from "tonal";

interface PlayerProps {
  chordProgressions: ChordProgression[];
}

const PITCH = "4";
const BPM = 100;

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props;

  const [chordPlaying, setChordPlaying] = useState<number>(-1);
  const [indexCurrentPlaying, setIndexChordPlaying] = useState<number>(0);
  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null);

  const getChordsPitches = (chordProgression: ChordProgression) => {
    return chordProgression.chords.map((chord) => {
      const notes = Chord.get(chord).notes;

      const pitches: number[] = notes
        .map((note) => Midi.toMidi(note + PITCH) as number)
        .filter((note) => !!note);

      return pitches;
    });
  };

  const playChordProgression = (indexChordProgression: number) => {
    const millisecondsPerBeat = 60000 / BPM; // Calculate the duration of each beat in milliseconds
    const chordProgressionPlaying = chordProgressions[indexChordProgression];
    const chordProgressionPitches = getChordsPitches(chordProgressionPlaying)
    setChordPlaying(indexChordProgression);
    let i = 0;

    const playNextChord = () => {
      if (i < chordProgressionPitches.length) {
        const chordPitches = chordProgressionPitches[i];
        // Play each chord
        setChordPlaying(i);
        midiSoundsRef.current?.playChordNow(4, chordPitches, 1);

        i++;
        setTimeout(playNextChord, millisecondsPerBeat);
      } else {
        setChordPlaying(-1);
      }
    };
    playNextChord();
  };

  const handlePlay = (indexChordProgression: number) => {
    setIndexChordPlaying(indexChordProgression);
    playChordProgression(indexChordProgression);
  };

  const isPlaying = (i: number) => i === indexCurrentPlaying;

  return (
    <div className="flex flex-column gap-5">
      <ul className="flex-1">
        {chordProgressions.map((chordProgression, index) => (
          <li key={index}>
            <ChordProgressionViewer
              index={index}
              chordProgression={chordProgression.chords}
              handlePlay={handlePlay}
              isPlaying={isPlaying}
              indexChordPlaying={chordPlaying}
            />
          </li>
        ))}
        <div className="hidden">
          <MIDISounds ref={midiSoundsRef} instruments={[4]} />
        </div>
      </ul>
      <p className="flex-initial w-36">Settings</p>
    </div>
  );
};

export default Player;
