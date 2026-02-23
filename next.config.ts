import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true, // Enable "use cache" directive
  },
  outputFileTracingIncludes: {
    '/api/business/details': ['./data/processed/lor_details/**/*.gz'],
    '/api/business/search': ['./data/processed/business_search_index.json.gz'],
    '/api/business': ['./data/processed/business_aggregated.json.gz']
  }
};

export default nextConfig;
