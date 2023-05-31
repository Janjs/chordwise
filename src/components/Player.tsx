"use client";

import { FC, useRef, useState } from "react";
import { ChordProgression } from "@/types/types";
import ChordProgressionViewer from "./ChordProgressionViewer";
import MIDISounds, { MIDISoundsMethods } from "midi-sounds-react";
import { Midi, Chord } from "tonal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlayerProps {
  chordProgressions: ChordProgression[];
}

const PITCH = "4";

// list of instruments: https://surikov.github.io/midi-sounds-react-examples/examples/midi-sounds-example3/build/
enum Instrument {
  piano = 4,
  guitar = 260,
  flute = 771,
}

const getChordsPitches = (chordProgression: ChordProgression) => {
  return chordProgression.chords.map((chord) => {
    const notes = Chord.get(chord).notes;

    const pitches: number[] = notes
      .map((note) => Midi.toMidi(note + PITCH) as number)
      .filter((note) => !!note);

    return pitches;
  });
};

const Player: FC<PlayerProps> = (props) => {
  const { chordProgressions } = props;

  const [chordPlaying, setChordPlaying] = useState<number>(-1);
  const [indexCurrentPlaying, setIndexChordPlaying] = useState<number>(0);
  const [instrument, setInstrument] = useState<keyof typeof Instrument>("piano");
  const [bpm, setBpm] =useState<number>(100);

  const midiSoundsRef = useRef<MIDISoundsMethods | null>(null);

  const playChordProgression = (indexChordProgression: number) => {
    const millisecondsPerBeat = 60000 / bpm; // Calculate the duration of each beat in milliseconds
    const chordProgressionPlaying = chordProgressions[indexChordProgression];
    const chordProgressionPitches = getChordsPitches(chordProgressionPlaying);
    setChordPlaying(indexChordProgression);
    let i = 0;

    const playNextChord = () => {
      if (i < chordProgressionPitches.length) {
        const chordPitches = chordProgressionPitches[i];
        // Play each chord
        setChordPlaying(i);
        midiSoundsRef.current?.playChordNow(
          Instrument[instrument],
          chordPitches,
          1
        );

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

  const instrumentValues: number[] = Object.values(Instrument).filter(v => typeof v === 'number').map(value => Number(value)).filter(v => v!!)

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
          <MIDISounds ref={midiSoundsRef} instruments={instrumentValues} />
        </div>
      </ul>
      <p className="flex-initial w-36 flex flex-col gap-5">
        <Select
          onValueChange={(d) => setInstrument(d as keyof typeof Instrument)}
          defaultValue={instrument}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Instruments</SelectLabel>
              <SelectItem value="piano">🎹 Piano</SelectItem>
              <SelectItem value="guitar">🎸 Guitar</SelectItem>
              <SelectItem value="flute">🪈 Flute</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* <Input type="email" placeholder="Email" /> */}
      </p>
    </div>
  );
};

export default Player;
