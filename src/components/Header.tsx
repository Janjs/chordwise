import Image from 'next/image';
import logo from '@/app/logo.svg';

export default function Header() {
  return (
    <header className="bg-transparent">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 px-8"
        aria-label="Global"
      >
        <div className="flex flex-1 justify-start">
        <Image
          priority
          src={logo}
          width={120}
          alt="chordwise logo"
        />
        </div>
        <div className="flex flex-1 justify-end">
          <h1>Chords progressions AI generator.</h1>
        </div>
      </nav>
    </header>
  );
}
