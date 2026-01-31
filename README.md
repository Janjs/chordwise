# Chordwise 🎵

An AI-powered chord progression generator that helps musicians discover fresh harmonic ideas. Whether you're a songwriter searching for inspiration or a guitarist looking for backing tracks, Chordwise enhances your musical creativity.

## ✨ Features

- **AI-Generated Progressions** — Describe the mood or style you want, and get chord progressions that match
- **Piano & Guitar Visualization** — See your chords displayed on both instruments
- **Audio Playback** — Listen to your progressions with built-in Web Audio
- **Key Selection** — Generate in any key or let the AI decide
- **Curated Suggestions** — Browse pre-made progressions for inspiration
- **Dark/Light Mode** — Easy on the eyes, day or night

## 🛠 Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [Convex](https://convex.dev/) — Backend and auth (self-hosted)
- [OpenAI](https://openai.com/) — AI chord generation
- [Tonal](https://github.com/tonaljs/tonal) — Music theory library
- [Tone.js](https://tonejs.github.io/) — Web Audio framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Radix UI](https://www.radix-ui.com/) — Accessible components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Janjs/chordwise.git
cd chordwise

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

### Convex (self-hosted)

The app uses a self-hosted Convex backend.

**Next.js app (Coolify)** — set **NEXT_PUBLIC_CONVEX_URL** to the **Convex backend** URL (e.g. `https://backend.chordwise.janjs.dev`). The frontend talks to Convex at this URL. Do not set it to the Next.js app URL.

**Convex backend** — OAuth redirects must go to the Next.js app, not the backend. Either:

1. **Preferred:** On the **Convex backend server** (where convex-backend runs: Coolify, Fly, Docker), set **CONVEX_SITE_ORIGIN** = **`https://chordwise.janjs.dev`** (the Next.js app URL). Restart/redeploy the Convex backend after changing it. If it’s missing or set to the backend URL, Google will redirect to the backend and sign-in will fail.

2. **Workaround:** If you can’t change backend env, add a redirect in front of the backend (e.g. Cloudflare, nginx): redirect `https://backend.chordwise.janjs.dev/api/auth/*` → `https://chordwise.janjs.dev/api/auth/*` (preserve query string). Then when Google sends users to the backend URL, they get sent to the Next.js app.

## 🔗 Demo

**[chordwise.janjs.dev](https://chordwise.janjs.dev)**

## 👤 Author

Made by [@Janjs](https://x.com/Janjijs)

## 📄 License

MIT
