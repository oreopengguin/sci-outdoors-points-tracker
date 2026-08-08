"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@/lib/cn";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "sot-theme";

type ThemeContextValue = {
  choice: ThemeChoice;
  resolved: "light" | "dark";
  setChoice: (choice: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function storedChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/** The OS preference, as an external store so it never needs syncing state. */
function subscribeToSystemTheme(listener: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The blocking script in <head> has already applied the right class; this
  // just reads the same source so React agrees with it.
  const [choice, setChoiceState] = useState<ThemeChoice>(storedChoice);

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  const resolved: "light" | "dark" =
    choice === "dark" || (choice === "system" && systemDark) ? "dark" : "light";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try {
      if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private browsing — the choice still applies for this session */
    }
  }, []);

  const value = useMemo(() => ({ choice, resolved, setChoice }), [choice, resolved, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Both icons are always in the markup and CSS picks one, so the server and the
 * client render byte-identical HTML while still showing the correct icon on
 * the very first paint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setChoice } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setChoice(resolved === "dark" ? "light" : "dark")}
      title="Switch between light and dark"
      aria-label="Switch between light and dark"
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)]",
        "text-ink-soft transition hover:text-ink hover:brightness-105",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true">
        <circle cx="12" cy="12" r="4.4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
        </g>
      </svg>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] dark:hidden" aria-hidden="true">
        <path d="M20.3 14.4A8.6 8.6 0 0 1 9.6 3.7a8.6 8.6 0 1 0 10.7 10.7Z" fill="currentColor" />
      </svg>
    </button>
  );
}
