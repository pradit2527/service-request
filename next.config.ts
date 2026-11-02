import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e run builds into its own folder, so its server does not clash with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
