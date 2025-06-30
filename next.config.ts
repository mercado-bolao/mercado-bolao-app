
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    PGDATABASE: process.env.PGDATABASE ?? "",
    PGHOST: process.env.PGHOST ?? "",
    PGPORT: process.env.PGPORT ?? "",
    PGUSER: process.env.PGUSER ?? "",
    PGPASSWORD: process.env.PGPASSWORD ?? "",
    EFI_SANDBOX: process.env.EFI_SANDBOX ?? "",
    EFI_PIX_KEY: process.env.EFI_PIX_KEY ?? "",
    EFI_CERTIFICATE_PATH: process.env.EFI_CERTIFICATE_PATH ?? "",
    EFI_CLIENT_ID: process.env.EFI_CLIENT_ID ?? "",
    EFI_CLIENT_SECRET: process.env.EFI_CLIENT_SECRET ?? "",
    EFI_CERTIFICATE_PASSPHRASE: process.env.EFI_CERTIFICATE_PASSPHRASE ?? "",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
  },
};


export default nextConfig;
