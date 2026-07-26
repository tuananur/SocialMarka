"use client";

import { SessionProvider } from "next-auth/react";
import { Toast } from "@heroui/react";
import { useEffect } from "react";

const ACCENT_COLORS: Record<string, string> = {
  blue: "oklch(0.54 0.19 255)",
  purple: "oklch(0.58 0.23 295)",
  emerald: "oklch(0.62 0.19 160)",
  orange: "oklch(0.64 0.21 45)",
  rose: "oklch(0.59 0.21 3)",
};

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applySettings = () => {
      // 1. Apply Accent Color
      const localAccent = localStorage.getItem("sm_accent") || "blue";
      const hexVal = ACCENT_COLORS[localAccent] || ACCENT_COLORS.blue;
      document.documentElement.style.setProperty("--accent", hexVal);

      // 2. Apply Light/Dark Theme
      const localTheme = localStorage.getItem("sm_theme") || "light";
      if (localTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (localTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (localTheme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    // Run on load
    applySettings();

    // Listen to changes from settings page
    window.addEventListener("sm-settings-changed", applySettings);

    return () => {
      window.removeEventListener("sm-settings-changed", applySettings);
    };
  }, []);

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
      <Toast.Provider placement="top end" maxVisibleToasts={3} />
    </SessionProvider>
  );
}
