'use client'

import { FC, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface UserInputProps {
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}
 
const UserInput: FC<UserInputProps> = (props) => {
  const { inputValue, onInputChange, onSubmit } = props;
  
  return ( 
    <form className="flex-1 flex flex-row justify-between space-x-5" onSubmit={onSubmit}>
      {/* TODO: add a dropdown to select the Key of the chords: */}
      {/* TODO: add a dropdown to select the style of the chords: */}
      <Input type="text" placeholder="Chords in the style of Nirvana" value={inputValue} onChange={onInputChange} />
      <Button>
        Generate
      </Button>
    </form>
   );
}
 
export default UserInput;