import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent broken pages when .next cache is cleared while dev server is running
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
