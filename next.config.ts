import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true, // Enable "use cache" directive
  },
  outputFileTracingIncludes: {
    '/api/business/details': ['./data/processed/lor_details/**/*'],
    '/api/business/search': ['./data/processed/business_search_index.json'],
    '/api/business': ['./data/processed/business_aggregated.json']
  }
};

export default nextConfig;
