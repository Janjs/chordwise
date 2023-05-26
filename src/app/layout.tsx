import Header from "@/components/Header";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chordwise",
  description: "Chords progressions AI generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <p className="fixed bottom-0 right-0 pr-14 pb-8 text-muted-foreground text-xs">
          Made by <a href="https://github.com/Janjs" className="text-foreground">@Janjs</a>
          <br />
          Powered by ChatGPT
        </p>
      </body>
    </html>
  );
}
