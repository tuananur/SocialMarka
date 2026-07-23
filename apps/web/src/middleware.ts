import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Domain routing (Traefik / Nginx arkasında):
 * - social.domain.com / socialmarka.com  → (marketing) tanıtım
 * - app.social.domain.com / app.socialmarka.com → (dashboard) panel
 * - api.* → /api rewrite
 * Local tek süreç (localhost:3000) → her iki route group
 */
function getHostType(host: string): "marketing" | "app" | "api" | "local" {
  const h = host.toLowerCase().split(":")[0];

  if (h === "localhost" || h === "127.0.0.1") {
    return "local";
  }

  if (h.startsWith("api.")) {
    return "api";
  }

  // app.social.* ve app.* (panel)
  if (h.startsWith("app.")) {
    return "app";
  }

  // social.* (yönetici diyagramı: social.domain.com)
  if (h.startsWith("social.")) {
    return "marketing";
  }

  if (
    h === "socialmarka.com" ||
    h === "www.socialmarka.com" ||
    h === "socialmarka.localhost" ||
    h === "www.socialmarka.localhost"
  ) {
    return "marketing";
  }

  return "local";
}

function isPublicMarketingPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/platforms") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  );
}

function isDashboardPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/admin")
  );
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const type = getHostType(host);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  // Marketing sayfalarında session okuma yok → hızlı yanıt
  if (
    (type === "local" || type === "marketing") &&
    isPublicMarketingPath(pathname)
  ) {
    return NextResponse.next();
  }

  if (type === "api") {
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = `/api${pathname === "/" ? "/health" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (type === "marketing") {
    if (
      isDashboardPath(pathname) ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://app.socialmarka.localhost";
      return NextResponse.redirect(new URL(pathname, appUrl));
    }
    return NextResponse.next();
  }

  if (type === "app") {
    if (isPublicMarketingPath(pathname) && pathname !== "/") {
      const marketingUrl =
        process.env.NEXT_PUBLIC_MARKETING_URL || "http://socialmarka.localhost";
      return NextResponse.redirect(new URL(pathname, marketingUrl));
    }
  }

  const needsAuthCheck =
    (type === "app" && (pathname === "/" || isDashboardPath(pathname))) ||
    (type === "local" && isDashboardPath(pathname));

  if (!needsAuthCheck) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  const isLoggedIn = !!token?.sub;

  if (type === "app" && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = isLoggedIn ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!isLoggedIn && isDashboardPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (type === "app") {
      url.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
