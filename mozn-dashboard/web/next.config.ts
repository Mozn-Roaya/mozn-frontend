import type { NextConfig } from "next";

// Multi-Zones: the dashboard is a child zone mounted under /dashboard behind the
// public app (see ../../mozn-public/frontend/next.config.ts `rewrites`). `basePath`
// makes every page live at /dashboard/* and auto-prefixes all next/link, router,
// and static (/dashboard/_next/*) URLs — so no per-link changes are needed.
// It is re-exposed as NEXT_PUBLIC_BASE_PATH for the few raw client `fetch()`
// calls that Next does NOT auto-prefix (basePath only rewrites Link/router/image).
const BASE_PATH = "/dashboard";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  reactStrictMode: true,
  // Keep the dev-only indicator out of the sidebar's bottom-left user card.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
