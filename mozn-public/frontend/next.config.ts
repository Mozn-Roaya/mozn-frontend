import type { NextConfig } from "next";

// Multi-Zones: this public app is the default zone (owns "/"). The admin
// dashboard is a separate Next app mounted at /dashboard (it sets
// `basePath: "/dashboard"`). Every /dashboard/* request — pages, API routes,
// and static assets (/dashboard/_next/*) — is proxied to the dashboard zone.
// In dev that's http://127.0.0.1:3001; in prod set DASHBOARD_URL to its origin.
//
// Use 127.0.0.1 (not "localhost") for the dev default: Node's proxy fetch
// resolves "localhost" to IPv6 ::1 first, but the Next dev server binds IPv4,
// so a "localhost" destination fails with ECONNRESET ("socket hang up").
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/dashboard", destination: `${DASHBOARD_URL}/dashboard` },
      {
        source: "/dashboard/:path*",
        destination: `${DASHBOARD_URL}/dashboard/:path*`,
      },
    ];
  },
};

export default nextConfig;
