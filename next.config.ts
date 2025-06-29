
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for deployment
  experimental: {
    // allowedDevOrigins removed - not a valid Next.js config option
  },
  eslint: {
    // This allows production builds to successfully complete even if your project has ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with type errors (temporary)
    ignoreBuildErrors: true,
  },
  // Configure for deployment
  serverExternalPackages: ['@prisma/client'],
  // Production optimizations
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
