import { FC, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import * as z from 'zod';

// list of instruments: https://surikov.github.io/midi-sounds-react-examples/examples/midi-sounds-example3/build/
export enum Instrument {
  piano = 4,
  guitar = 260,
  flute = 771,
}

interface PlayerSettingsProps {
  instrumentKey: keyof typeof Instrument;
  tempo: number;
  pitch: number;
  setInstrumentKey: (instrumentKey: keyof typeof Instrument) => void;
  setTempo: (tempo: number) => void;
  setPitch: (pitch: number) => void;
}

const tempoSchema = z.number().min(5, {
  message: "Tempo must be at least 5.",
}).max(300, {
  message: "Tempo must not be more than 300.",
});
const pitchSchema = z.number().min(1, {
  message: "Pitch must be at least 1.",
}).max(8, {
  message: "Pitch must not be more than 8.",
});
const DEFAULT_TEMPO = 120
const DEFAULT_PITCH = 5

const PlayerSettings: FC<PlayerSettingsProps> = (props) => {
  const { instrumentKey, tempo, pitch, setInstrumentKey, setTempo, setPitch } = props

  const [pitchError, setPitchError] = useState<string>("")
  const [tempoError, setTempoError] = useState<string>("")

  const checkTempoError = () => {
    try {
      tempoSchema.parse(tempo)
    } catch(error) {
      if(error instanceof z.ZodError) {
        setTempoError(error.issues[0].message)
        setTempo(DEFAULT_TEMPO)
      } else throw new Error("Unknown error.")
    }
  }

  const checkPitchError = () => {
    try {
      pitchSchema.parse(pitch)
    } catch(error) {
      if(error instanceof z.ZodError) {
        setPitchError(error.issues[0].message)
        setPitch(DEFAULT_PITCH)
      } else throw new Error("Unknown error.")
    }
  }

  return (
    <div className="w-40 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Instrument</Label>
        <Select
          onValueChange={(d) => setInstrumentKey(d as keyof typeof Instrument)}
          defaultValue={instrumentKey}
        >
          <SelectTrigger>
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
      </div>
      <div className="flex flex-col gap-2">
        <Label>Tempo</Label>
        <div className="flex flex-row">
          <Input
            type="number"
            value={tempo}
            min="5"
            max="300"
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-auto"
            onSelect={() => setTempoError("")}
            onMouseLeave={checkTempoError}
          />
          <p className="flex justify-center items-center ml-2">bpm</p>
        </div>
        {tempoError && <p className="text-sm font-medium text-destructive">{tempoError}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label>Pitch</Label>
        <div className="flex">
          <Input
            type="number"
            value={pitch}
            min="1"
            max="8"
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-auto"
            onSelect={() => setPitchError("")}
            onMouseLeave={checkPitchError}
          />
        </div>
        {pitchError && <p className="text-sm font-medium text-destructive">{pitchError}</p>}
      </div>
    </div>
  );
};

export default PlayerSettings;
