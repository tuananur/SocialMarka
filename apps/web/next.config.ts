import type { NextConfig } from "next";
import path from "path";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
);

const prismaEngines = [
  path.join(__dirname, "../../node_modules/.prisma/client/**"),
  path.join(__dirname, "../../node_modules/@prisma/client/**"),
  path.join(__dirname, "./node_modules/.prisma/client/**"),
  path.join(__dirname, "./node_modules/@prisma/client/**"),
];

const nextConfig: NextConfig = {
  // Do not use `output: "standalone"` on Vercel — it drops Prisma engines.
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
  serverExternalPackages: ["@prisma/client", ".prisma/client", "prisma", "bullmq", "ioredis"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": prismaEngines,
    "/api/**/*": prismaEngines,
    "/api/auth/**/*": prismaEngines,
  },
};

export default nextConfig;
