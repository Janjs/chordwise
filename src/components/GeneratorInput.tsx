'use client'

import { FC } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface GeneratorInputProps {}
 
const GeneratorInput: FC<GeneratorInputProps> = () => {
  return ( 
    <div className="flex-1 flex flex-row justify-between space-x-5">
      <Input placeholder="Chords in the style of Nirvana" />
      <Button>
        Generate
      </Button>
    </div>
   );
}
 
export default GeneratorInput;