import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const isGoogleAuthConfigured = Boolean(googleId && googleSecret);

/** Edge-safe config (middleware). Credentials live in auth.ts */
export const authConfig: NextAuthConfig = {
  providers: [
    ...(isGoogleAuthConfigured
      ? [
          Google({
            clientId: googleId!,
            clientSecret: googleSecret!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/posts") ||
        pathname.startsWith("/calendar") ||
        pathname.startsWith("/accounts") ||
        pathname.startsWith("/inbox") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/admin");
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
};
