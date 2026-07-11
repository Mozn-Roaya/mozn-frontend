import type { NextConfig } from "next";

// The public (citizen) app owns its own origin (mozn.org.ly). The admin dashboard
// is a fully separate deployment on its own subdomain (dashboard.mozn.org.ly), so
// this app no longer proxies /dashboard — each is served independently.
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
