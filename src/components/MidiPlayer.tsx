"use client";

import MidiWriter, { Pitch } from "midi-writer-js";
import "tone";
import "@magenta/music";
import "focus-visible";
import "html-midi-player";
import { FC, useEffect } from "react";

interface MidiPlayerProps {
  index: number;
  chords: string[][]
}

const MidiPlayer: FC<MidiPlayerProps> = (props) => {
  const { index, chords } = props;

  useEffect(() => {
    // generate MIDI file
    const track = new MidiWriter.Track();

    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
    track.setTempo(125, 0)

    chords.forEach((notes) => {
      // Add some notes:
      const noteEvent = new MidiWriter.NoteEvent({pitch: notes as Pitch[], duration: '4'});
      track.addEvent(noteEvent);
    });

    const midiWriter = new MidiWriter.Writer(track);

    // Add HTML components from the html-midi-player
    const midiVisualizer = document.createElement('midi-visualizer');
    midiVisualizer.setAttribute('src', midiWriter.dataUri());
    midiVisualizer.setAttribute('type', 'piano-roll');
    midiVisualizer.setAttribute('id', `midiVisualizer-${index}`);
    document.getElementById(`midi-${index}`)?.appendChild(midiVisualizer);
    
    const midiPlayer = document.createElement('midi-player');
    midiPlayer.setAttribute('src', midiWriter.dataUri());
    midiPlayer.setAttribute('sound-font', 'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
    midiPlayer.setAttribute('visualizer', `#midiVisualizer-${index}`);
    midiPlayer.setAttribute('id', 'midiPlayer');
    document.getElementById(`midi-${index}`)?.appendChild(midiPlayer);
  }, []);

  return (
    <div id={`midi-${index}`}></div>
  );
}

export default MidiPlayer
  