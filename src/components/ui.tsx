"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

/**
 * True once we're running in the browser. Overlays render into <body> via a
 * portal — an ancestor with any `transform` (including the identity matrix a
 * finished CSS animation leaves behind) becomes the containing block for
 * `position: fixed`, which would otherwise pin a modal to the middle of the
 * page instead of the viewport.
 */
const noopSubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* ---------------------------------------------------------------- button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--leaf)] text-white shadow-sm hover:brightness-110 active:brightness-95 disabled:hover:brightness-100",
  secondary:
    "bg-[var(--surface)] text-ink border border-[var(--line-strong)] hover:bg-[var(--surface-2)]",
  ghost: "text-ink-soft hover:bg-[color-mix(in_oklab,var(--ink)_7%,transparent)] hover:text-ink",
  danger: "bg-[#c0392b] text-white shadow-sm hover:brightness-110 active:brightness-95",
  quiet: "bg-[var(--leaf-soft)] text-[var(--leaf)] hover:brightness-105",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin", className)} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------- input */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] font-medium text-[#c0392b]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-faint transition focus:border-[var(--leaf)] focus:outline-none " +
  "focus:ring-4 focus:ring-[color-mix(in_oklab,var(--leaf)_18%,transparent)] disabled:opacity-60 " +
  "aria-[invalid=true]:border-[#c0392b] aria-[invalid=true]:focus:ring-[#c0392b33]";

/* ---------------------------------------------------------------- dialog */

/**
 * Focus-trapped modal. Written by hand rather than pulled in as a dependency
 * so the escape/backdrop/restore-focus behaviour is identical everywhere and
 * there is nothing extra in the bundle.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Latest onClose, without making it an effect dependency.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const timer = setTimeout(() => {
      const first = focusables()[0];
      (first ?? panelRef.current)?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus?.();
    };
    // Deliberately keyed on `open` alone. Callers pass inline arrows for
    // onClose, so including it here would tear the trap down and restore focus
    // to the page underneath on every parent re-render — which, among other
    // things, sends the next keystroke to whatever was focused before the
    // dialog opened.
  }, [open]);

  if (!open) return null;

  const width = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <Overlay>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          className="absolute inset-0 bg-[rgb(10_18_13_/_0.55)] backdrop-blur-sm anim-fade"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "card relative flex max-h-[92vh] w-full flex-col overflow-hidden anim-rise",
            "rounded-b-none sm:rounded-b-[var(--radius-card)]",
            width,
          )}
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-lg font-bold text-ink">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-[13px] text-ink-soft">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer ? (
            <footer className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-3.5">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </Overlay>
  );
}

/* ----------------------------------------------------------------- toast */

export type Toast = {
  id: number;
  tone: "success" | "error" | "info";
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.action ? 9_000 : 5_000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Overlay>
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3 anim-rise"
              style={{ boxShadow: "var(--shadow-lift)" }}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                style={{
                  background:
                    toast.tone === "success"
                      ? "var(--leaf)"
                      : toast.tone === "error"
                        ? "#c0392b"
                        : "var(--ink-soft)",
                }}
              >
                {toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                {toast.detail ? (
                  <p className="mt-0.5 text-[13px] text-ink-soft">{toast.detail}</p>
                ) : null}
                {toast.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                    className="mt-1.5 text-[13px] font-semibold text-[var(--leaf)] underline underline-offset-2 hover:opacity-80"
                  >
                    {toast.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </Overlay>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ misc */

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "leaf" | "gold" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[color-mix(in_oklab,var(--ink)_7%,transparent)] text-ink-soft",
    leaf: "bg-[var(--leaf-soft)] text-[var(--leaf)]",
    gold: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[var(--gold)]",
    danger: "bg-[#c0392b1f] text-[#c0392b]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
