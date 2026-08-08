import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing in this project is generated for tooling assistants.
  agentRules: false,

  // Security headers are set per-request in src/proxy.ts (they need a
  // per-request CSP nonce). These are the ones that are safe to pin statically
  // and useful even on responses the proxy doesn't touch.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // The API is authoritative and always dynamic; never let a proxy cache it.
  poweredByHeader: false,
};

export default nextConfig;
