import type { NextConfig } from "next";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
);

const nextConfig: NextConfig = {
  output: "standalone",
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
  serverExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis"],
};

export default nextConfig;
