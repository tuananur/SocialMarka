"use client";

export type AuthWelcomeKind = "login" | "register";

const STORAGE_KEY = "sm_auth_welcome";

export function queueAuthWelcome(kind: AuthWelcomeKind, name?: string | null) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ kind, name: name || null, at: Date.now() })
  );
}

export function consumeAuthWelcome(): { kind: AuthWelcomeKind; name: string | null } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const data = JSON.parse(raw) as { kind: AuthWelcomeKind; name?: string | null; at: number };
    if (Date.now() - data.at > 60_000) return null;
    return { kind: data.kind, name: data.name ?? null };
  } catch {
    return null;
  }
}

export function showAuthSuccessToast(_kind: AuthWelcomeKind, _name?: string | null) {
  // no-op
}
