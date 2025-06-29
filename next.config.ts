
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove allowedDevOrigins for production
  eslint: {
    // This allows production builds to successfully complete even if your project has ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
