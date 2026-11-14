import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// The browser only ever talks to this app and to the project's Supabase API
// (REST over https, Realtime over wss).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();
const supabaseOrigins = supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; nonces would force dynamic rendering.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // blob: = local photo preview; Supabase = wall photos if served unoptimized.
  `img-src 'self' data: blob: ${supabaseHost ? `https://${supabaseHost}` : ""}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigins}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // CSP only in production: the dev server relies on eval and its own websocket.
  ...(isProd ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Wall photos live in this project's public wall-photos bucket only.
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/wall-photos/**",
          },
        ]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
