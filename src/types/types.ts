import { ChatCompletionResponseMessage } from "openai";

export interface GeneratedChords {
  chords: ChatCompletionResponseMessage | undefined;
}