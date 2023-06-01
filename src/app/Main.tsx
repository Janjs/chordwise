'use client';

import { useState } from "react";
import UserInput, { formSchema } from "../components/UserInput";
import * as z from "zod";
import { Separator } from "../components/ui/separator";
import { ChordProgression } from "@/types/types";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import Player from "@/components/Player";

const Main = () => {
  const [loading, setLoading] = useState(false);
  const [chordProgressions, setChordProgressions] = useState<ChordProgression[]>([]);
  const [error, setError] = useState(null);
  const [otherResponse, setOtherResponse] = useState(null);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    setError(null);
    setChordProgressions([]);
    setOtherResponse(null);

    console.log(values)

    fetch("/api/generateChords", {
      method: "POST",
      body: JSON.stringify({
        description: values.description,
        musicalKey: values.musicalKey,
        musicalScale: values.musicalScale
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
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex-1 max-w-screen-lg flex flex-col">
      <UserInput
        onSubmit={handleSubmit}
        loading={loading}
      />
      <Separator className="my-5" />
      {chordProgressions.length > 0 && (
        <Player chordProgressions={chordProgressions} />
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
