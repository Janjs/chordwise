import Image from "next/image";
import logo from "@/assets/logo.svg";
import ThemeChanger from "./ThemeChanger";

export default function Header() {
  return (
    <header className="bg-transparent">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8"
        aria-label="Global"
      >
        <div className="flex flex-1">
          <Image priority src={logo} width={120} alt="chordwise logo" />
        </div>
        <div className="flex flex-1 italic justify-center">
          <h1>Chords progressions AI generator.</h1>
        </div>
        <div className="flex flex-1 justify-end">
          <ThemeChanger />
        </div>
      </nav>
    </header>
  );
}
