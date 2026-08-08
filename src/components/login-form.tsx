"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LeafMark } from "@/components/brand";
import { useLive } from "@/components/live-state";
import { Button, Field, inputClass, useToast } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";
import { api, ApiError } from "@/lib/client";

export function LoginForm({ turnedAway }: { turnedAway: boolean }) {
  const router = useRouter();
  const { data, refresh, setSignedIn } = useLive();
  const { push } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Already signed in? Send them straight through — but never when we got here
  // by being turned away from /teacher. In that case the API and the page
  // disagree about the session, and bouncing back would loop forever. Say what
  // happened instead.
  useEffect(() => {
    if (data?.signedIn && !turnedAway) router.replace("/teacher");
  }, [data?.signedIn, turnedAway, router]);

  const sessionRejected = turnedAway && (data?.signedIn ?? false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await api.login(username, password);
      setSignedIn(true, result.teacher);
      await refresh();
      push({ tone: "success", title: "Signed in", detail: "You can award points now." });
      router.push("/teacher");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection.";
      setError(message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg text-[13px] font-semibold text-ink-soft hover:text-ink"
          >
            ← Back to the board
          </Link>
          <ThemeToggle />
        </div>

        <div className="card px-6 py-8 anim-rise">
          <div className="flex flex-col items-center text-center">
            <LeafMark className="h-14 w-14" />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">Teacher sign in</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Signing in lets you award points, edit teams and start a new season. Everyone else can
              watch the board without an account.
            </p>
          </div>

          {sessionRejected ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-[#c0392b55] bg-[#c0392b0f] px-4 py-3 text-left"
            >
              <p className="text-[13px] font-semibold text-ink">
                Your session wasn&rsquo;t accepted
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                You signed in, but the server turned you away from the console. That usually means
                this deployment has no shared session key. Connect a Redis store, or set an{" "}
                <code className="font-mono text-[12px]">AUTH_SECRET</code> environment variable,
                then redeploy and sign in again.
              </p>
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Username">
              {(props) => (
                <input
                  {...props}
                  ref={usernameRef}
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              )}
            </Field>

            <Field label="Password" error={error}>
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-20`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint hover:text-ink"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              )}
            </Field>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-ink-faint">
          Sign-in attempts are rate limited and every change is recorded in the point log.
        </p>
      </div>
    </main>
  );
}
