import Header from "./header";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          {children}
          {/*Make this a hover-card https://ui.shadcn.com/docs/components/hover-card*/}
          <p className="fixed bottom-0 left-0 right-0 text-right bg-gradient-to-t from-background to-transparent pr-10 pb-5 pt-14 text-muted-foreground text-xs">
            Made by{" "}
            <a href="https://github.com/Janjs" className="text-foreground">
              @Janjs
            </a>
            <br />
            Powered by ChatGPT
          </p>
        </ThemeProvider>
      </body>
    </html>
  );
}
