/**
 * Local'de Traefik olmadan tek Next süreci (localhost:3000) kullanılır.
 * *.localhost yalnızca docker compose + Traefik ayağa kalktığında geçerlidir.
 */
export function getLoginHref(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  // Traefik yokken *.localhost ERR_CONNECTION_REFUSED verir → relative path
  if (
    !appUrl ||
    appUrl.includes("localhost:3000") ||
    appUrl.includes(".localhost") ||
    process.env.NODE_ENV === "development"
  ) {
    return "/login";
  }
  return `${appUrl}/login`;
}

export function getMarketingHref(path = "/"): string {
  const marketing = process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, "") || "";
  if (
    !marketing ||
    marketing.includes("localhost:3000") ||
    marketing.includes(".localhost") ||
    process.env.NODE_ENV === "development"
  ) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return `${marketing}${path.startsWith("/") ? path : `/${path}`}`;
}
