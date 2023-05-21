import openai from "@/app/api/generateChords/openai";
import { ChordProgression } from "@/types/types";
import { NextResponse } from "next/server";

export interface GenerateChordsRequest {
  description?: string;
}

export async function POST(req: Request) {
  const userInput: GenerateChordsRequest = await req.json();

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.8,
    n: 1,
    stream: false,
    messages: [
      {
        role: "system",
        content: `You are a generator of chord progressions. 
          The user will ask you to generate a numbered list of 5 chord progressions in a certain key and that fit a certain description. 
          You will respond with a boolean (true or false) if you were able to complete the request, followed by the numbered list.`,
      },
      {
        role: "user",
        content: `Generate 5 chord progressions in the key of C major that fit the following description: ${userInput.description}}`,
      },
    ],
  });

  const chordProgressions: ChordProgression[] = parseChords(
    completion.data.choices[0].message?.content
  );
  return NextResponse.json({ chordProgressions });
}

function parseChords(chordsString?: string) {
  if (chordsString) {
    return chordsString.split("\n").map((item) => {
      const elements = item
        .split("-")
        .map((e) => e.trim().replace(/^\d+\.\s*/, ""));
      return { chords: elements };
    });
  } else {
    return [];
  }
}
