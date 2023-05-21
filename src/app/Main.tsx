'use client';

import { ChangeEvent, FormEvent, useState } from "react";
import UserInput from "../components/UserInput";
import { Separator } from "../components/ui/separator";
import { ChordProgression } from "@/types/types";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import ChordsPlayer from "@/components/ChordsPlayer";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const [chordProgressions, setChordProgressions] = useState<
    ChordProgression[]
  >([]);
  const [error, setError] = useState(null);
  const [otherResponse, setOtherResponse] = useState(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setChordProgressions([]);
    setOtherResponse(null);

    fetch("/api/generateChords", {
      method: "POST",
      body: JSON.stringify({
        description: inputValue,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.found) {
          setChordProgressions(data.chordProgressions);
        } else {
          setOtherResponse(data.otherResponse);
        }
      })
      .catch((error) => setError(error));
  };

  return (
    <div className="flex-1 max-w-screen-lg flex flex-col">
      <UserInput
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
      <Separator className="my-5" />
      {chordProgressions.length > 0 && (
        <ul>
          {chordProgressions.map((chordProgression, index) => (
            <li key={index} className="">
              <ChordsPlayer chordProgression={chordProgression.chords} />
            </li>
          ))}
        </ul>
      )}
      {otherResponse && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{otherResponse}</AlertTitle>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
    </div>
  );
};

export default Main;
