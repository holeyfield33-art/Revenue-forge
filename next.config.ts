import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run separately; the current ESLint setup cannot run inside
    // `next build` (eslint-plugin-prettier's `prettier` peer is not installed).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
