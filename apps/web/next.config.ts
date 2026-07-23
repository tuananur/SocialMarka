import type { NextConfig } from "next";
import path from "path";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
);

const nextConfig: NextConfig = {
  transpilePackages: ["@socialmarka/db", "@socialmarka/queue", "@socialmarka/shared"],
  env: {
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: googleConfigured ? "true" : "false",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  serverExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "../../node_modules/.prisma/client/**/*",
      "../../node_modules/@prisma/client/**/*",
    ],
    "/api/**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "../../node_modules/.prisma/client/**/*",
      "../../node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
