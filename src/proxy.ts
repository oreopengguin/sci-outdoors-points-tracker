import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers for every response.
 *
 * The important one is the Content-Security-Policy: scripts must carry a
 * per-request nonce, which means an injected `<script>` — the classic way a
 * student would try to drive the admin API from the page — simply will not
 * execute. Next.js picks the nonce up from the request header and stamps it on
 * its own bootstrap scripts automatically.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' lets Next's bootstrap load its own chunks; nothing else
    // gets to run. Dev needs eval for React Refresh.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""}`,
    // Tailwind and our animation styles are injected inline at runtime.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  );
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("x-dns-prefetch-control", "off");
  if (!isDev) {
    response.headers.set(
      "strict-transport-security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own static output and the favicon.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
