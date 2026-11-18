import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Dev only: also allow opening the app by the PC's local IP (e.g. from a phone or tablet on
  // the café Wi-Fi), not just localhost. No effect on production builds.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
