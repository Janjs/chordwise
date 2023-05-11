import openai from "@/openai";
import { GeneratedChords } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export interface GenerateChordsRequest {
  description: string;
}

export async function POST(req: NextApiRequest) {
  const userInput = req.body as GenerateChordsRequest;

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-small',
    temperature: 0.8,
    n: 1,
    stream: false,
    messages: [
      {
        role: 'system',
        content: `You are a generator of chord progressions. 
        The user will ask you to generate a numbered list of 5 chord progressions in a certain key and that fit a certain description. 
        You will only respond with the numbered list.` 
      },
      {
        role: 'user',
        content: `Generate 5 chord progressions in the key of C major that fit the following description: ${userInput.description}}`
      }
    ]
  })

  const { data } = response;
  return NextResponse.json({ chords: data.choices[0].message })
}