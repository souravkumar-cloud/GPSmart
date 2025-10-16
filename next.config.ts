import type { NextConfig } from "next";

// next.config.js
const nextConfig = {
  experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: 10 * 1024 * 1024, // 10 MB
  },
};

export default nextConfig;
