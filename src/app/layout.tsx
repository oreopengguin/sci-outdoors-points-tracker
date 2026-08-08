import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";

import "./globals.css";
import { TopoBackdrop } from "@/components/brand";
import { LiveStateProvider } from "@/components/live-state";
import { PointPopup } from "@/components/point-popup";
import { ThemeProvider } from "@/components/theme";
import { ToastProvider } from "@/components/ui";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Science Outdoors Tuff Points Tracker",
    template: "%s · Science Outdoors Tuff Points Tracker",
  },
  description:
    "Live team scores for Science Outdoors. Track points, celebrate the leaders, and keep the whole group in the loop.",
  applicationName: "Science Outdoors Tuff Points Tracker",
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/leaf.svg", type: "image/svg+xml" }],
    apple: [{ url: "/leaf.svg" }],
  },
  openGraph: {
    title: "Science Outdoors Tuff Points Tracker",
    description: "Live team scores for Science Outdoors.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Applied before first paint so a dark-mode visitor never gets a white flash.
 * It runs under the CSP nonce that middleware issues for this request.
 */
const THEME_BOOTSTRAP = `(function(){try{var c=localStorage.getItem('sot-theme');var d=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <Script id="sot-theme" strategy="beforeInteractive" nonce={nonce}>
          {THEME_BOOTSTRAP}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <TopoBackdrop />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <LiveStateProvider initial={null}>
              {children}
              <PointPopup />
            </LiveStateProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
