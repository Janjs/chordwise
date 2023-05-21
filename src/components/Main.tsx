"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import UserInput from "./UserInput";
import { Separator } from "./ui/separator";
import { ChordProgression } from "@/types/types";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const [chordProgressions, setChordProgressions] = useState<ChordProgression[]>(
    []
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Input value:", inputValue);

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
        setChordProgressions(data.chordProgressions);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div className="flex-1 max-w-screen-lg flex flex-col">
      <UserInput
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
      <Separator className="my-5" />
      <ul>
        {chordProgressions.map((chordProgression) => (
          <li>{chordProgression.chords}</li>
        ))}
      </ul>
    </div>
  );
};

export default Main;
