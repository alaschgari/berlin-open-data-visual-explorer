import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true, // Enable "use cache" directive
  }
};

export default nextConfig;
