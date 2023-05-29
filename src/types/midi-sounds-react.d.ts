declare module 'midi-sounds-react' {
  import React from 'react';

  interface MIDISoundsProps {
    ref?: React.RefObject<MIDISoundsMethods>;
    appElementName?: string;
    instruments?: number[];
  }

  export interface MIDISoundsMethods {
    playChordNow(channel: number, pitches: number[], duration: number): void;
    cancelQueue(): void;
  }

  type MIDISoundsComponent = React.ForwardRefExoticComponent<
    MIDISoundsProps & React.RefAttributes<MIDISoundsMethods>
  >;

  const MIDISounds: MIDISoundsComponent;

  export default MIDISounds;
}