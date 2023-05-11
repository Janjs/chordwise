'use client'

import { ChangeEvent, FormEvent, useState } from "react";
import UserInput from "./UserInput";
import { Separator } from "./ui/separator";
import { GeneratedChords } from "@/types/types";

const Main = () => {
  const [inputValue, setInputValue] = useState('');
  const [generatedChords, setGeneratedChords] = useState<GeneratedChords>();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Input value:', inputValue);

    fetch('/api/generateChords', {
      method: 'POST',
      body: JSON.stringify({
        description: inputValue
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json()).then(data => {
      console.log(data)
      setGeneratedChords(data)
    }).catch(error => 
      console.log(error)
    );
  };
  
  return ( 
    <div className="flex-1 max-w-screen-lg flex flex-col">
      <UserInput
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
      <Separator className="my-5" />
      <h1>{generatedChords?.chords?.content}</h1>
    </div>
  );
}
 
export default Main;