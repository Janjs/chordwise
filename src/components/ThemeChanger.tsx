"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeChanger = () => {
  const [domLoaded, setDomLoaded] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    setTheme(event.matches ? "dark" : "light");
  };

  useEffect(() => {
    setDomLoaded(true);
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handleSystemThemeChange);
    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return (
    <>
      {domLoaded && (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "dark" ? <Moon /> : <Sun />}
        </Button>
      )}
    </>
  );
};

export default ThemeChanger;
