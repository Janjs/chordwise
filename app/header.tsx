import ModeToggle from "../components/modo-changer";
import ThemedLogo from "@/assets/themed-logo";

export default function Header() {
  return (
    <header className="bg-transparent">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8"
        aria-label="Global"
      >
        <div className="flex flex-1">
          <ThemedLogo />
        </div>
        <div className="flex flex-1 italic justify-center text-center">
          <h1>Chord progressions AI generator.</h1>
        </div>
        <div className="flex flex-1 justify-end">
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}