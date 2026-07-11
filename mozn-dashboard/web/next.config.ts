import type { NextConfig } from "next";

// The dashboard is deployed on its own subdomain (dashboard.mozn.org.ly), served
// at the root — so no basePath. It is still re-exposed as NEXT_PUBLIC_BASE_PATH
// (now "") for the few raw client `fetch()` calls that reference it; those resolve
// to /api/... at the root. If it's ever mounted under a path again, set this back
// to that path (e.g. "/dashboard") and everything auto-prefixes.
const BASE_PATH = "";

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
