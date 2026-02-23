import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true, // Enable "use cache" directive
  },
  outputFileTracingIncludes: {
    '/api/**/*': [
      './data/processed/lor_details/**/*.gz',
      './data/processed/business_search_index.json.gz',
      './data/processed/business_aggregated.json.gz'
    ]
  }
};

export default nextConfig;
