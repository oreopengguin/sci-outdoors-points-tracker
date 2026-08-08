"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/brand";
import { useLive } from "@/components/live-state";
import { ThemeToggle } from "@/components/theme";
import { Button, useToast } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Leaderboard", icon: "🏆" },
  { href: "/display", label: "Big screen", icon: "🖥" },
  { href: "/history", label: "History", icon: "📜" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, refresh } = useLive();
  const { push } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signedIn = data?.signedIn ?? false;

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api.logout();
      await refresh();
      push({ tone: "info", title: "Signed out" });
      router.push("/");
    } catch {
      push({
        tone: "error",
        title: "Couldn't sign out",
        detail: "Check your connection and try again.",
      });
    } finally {
      setSigningOut(false);
      setMenuOpen(false);
    }
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--canvas)_86%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="min-w-0 shrink-0 rounded-lg"
          aria-label="Science Outdoors Tuff Points Tracker — home"
        >
          <Wordmark size="md" className="hidden sm:flex" />
          <Wordmark size="sm" className="flex sm:hidden" />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-semibold transition",
                isActive(item.href)
                  ? "bg-[var(--leaf-soft)] text-[var(--leaf)]"
                  : "text-ink-soft hover:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] hover:text-ink",
              )}
            >
              <span aria-hidden="true" className="mr-1.5">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ThemeToggle />

          {signedIn ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/teacher">
                <Button
                  variant={pathname.startsWith("/teacher") ? "primary" : "secondary"}
                  size="md"
                >
                  Teacher console
                </Button>
              </Link>
              <Button variant="ghost" size="md" onClick={signOut} loading={signingOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="primary" size="md">
                Teacher sign in
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d={menuOpen ? "M4 4l12 12M16 4L4 16" : "M3 6h14M3 10h14M3 14h14"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 md:hidden anim-fade"
        >
          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-semibold",
                  isActive(item.href)
                    ? "bg-[var(--leaf-soft)] text-[var(--leaf)]"
                    : "text-ink-soft",
                )}
              >
                <span aria-hidden="true" className="mr-2">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-[var(--line)] pt-3">
              {signedIn ? (
                <>
                  <Link href="/teacher" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Teacher console
                    </Button>
                  </Link>
                  <Button variant="secondary" onClick={signOut} loading={signingOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Teacher sign in
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
