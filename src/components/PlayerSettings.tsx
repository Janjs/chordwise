import { Dispatch, FC, SetStateAction } from "react";
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

const PlayerSettings: FC<PlayerSettingsProps> = (props) => {
  const { instrumentKey, tempo, pitch, setInstrumentKey, setTempo, setPitch } = props
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
          />
          <p className="flex justify-center items-center ml-2">bpm</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Pitch</Label>
        <div className="flex flex-row">
          <Input
            type="number"
            value={pitch}
            min="1"
            max="8"
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerSettings;
