"use client";

import { FC, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface UserInputProps {
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}

const UserInput: FC<UserInputProps> = (props) => {
  const { inputValue, onInputChange, onSubmit, loading } = props;

  return (
    <form
      className="flex-1 flex flex-row justify-between space-x-5"
      onSubmit={onSubmit}
    >
      {/* TODO: add a dropdown to select the Key of the chords: */}
      {/* TODO: add a dropdown to select the style of the chords: */}
      <Input
        type="text"
        placeholder="Chords in the style of Nirvana"
        value={inputValue}
        onChange={onInputChange}
      />
      {!loading ? (
        <Button>Generate</Button>
      ) : (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating
        </Button>
      )}
    </form>
  );
};

export default UserInput;
