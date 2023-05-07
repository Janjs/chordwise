export default function Header() {
  return (
    <header className="bg-transparent">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8"
        aria-label="Global"
      >
        <div className="flex flex-1 justify-start">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <h1 className="font-bold">chordwise</h1>
          </a>
        </div>
        <div className="flex flex-1 justify-end">
          <h1>Chords progressions AI generator.</h1>
        </div>
      </nav>
    </header>
  );
}
