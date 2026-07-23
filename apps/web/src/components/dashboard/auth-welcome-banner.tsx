"use client";

import { useEffect, useState } from "react";
import { consumeAuthWelcome } from "@/lib/auth-welcome";

/** Kısa overlay — Strict Mode’da timeout kaybolmasın diye ayrı effect */
export function AuthWelcomeBanner({ userName }: { userName?: string | null }) {
  const [banner, setBanner] = useState<{
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const welcome = consumeAuthWelcome();
    if (!welcome) return;

    const name = welcome.name || userName;
    if (welcome.kind === "register") {
      setBanner({
        title: "Kayıt başarılı",
        description: `Hesabınız oluşturuldu${name ? `, ${name}` : ""}. SocialMarka paneline hoş geldiniz.`,
      });
    } else {
      setBanner({
        title: "Giriş başarılı",
        description: `Başarıyla giriş yaptınız${name ? `, ${name}` : ""}. İyi çalışmalar!`,
      });
    }
  }, [userName]);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 3500);
    return () => window.clearTimeout(t);
  }, [banner]);

  if (!banner) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4 sm:top-[4.25rem]">
      <div className="pointer-events-auto flex w-full max-w-lg items-start gap-3 animate-fade-in rounded-2xl border border-emerald-200/80 bg-white px-4 py-3 shadow-[var(--shadow-lift)]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900">{banner.title}</p>
          <p className="mt-0.5 text-sm text-ink-500">{banner.description}</p>
        </div>
        <button
          type="button"
          aria-label="Kapat"
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
          onClick={() => setBanner(null)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
