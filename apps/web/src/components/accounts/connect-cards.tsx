"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderIcon } from "@/components/posts/provider-icon";

type ConnectAction = {
  label: string;
  type: string;
  href: string;
};

type PlatformCard = {
  id: string;
  name: string;
  actions: ConnectAction[];
  soon?: boolean;
  followUs?: boolean;
};

function connectHref(provider: string, type: string) {
  return `/api/auth/${provider}/connect?type=${encodeURIComponent(type)}`;
}

const CARDS: PlatformCard[] = [
  {
    id: "FACEBOOK",
    name: "Facebook",
    actions: [{ label: "Connect Page", type: "page", href: connectHref("facebook", "page") }],
  },
  {
    id: "INSTAGRAM",
    name: "Instagram",
    actions: [
      {
        label: "Connect Personal",
        type: "personal",
        href: connectHref("instagram", "personal"),
      },
      {
        label: "Connect Business or Creator",
        type: "business",
        href: connectHref("instagram", "business"),
      },
    ],
  },
  {
    id: "GBP",
    name: "Google Business Profile",
    soon: true,
    actions: [
      {
        label: "Connect Profile",
        type: "profile",
        href: "/api/auth/google/connect?type=profile",
      },
    ],
  },
  {
    id: "LINKEDIN",
    name: "LinkedIn",
    actions: [
      {
        label: "Connect Profile",
        type: "profile",
        href: connectHref("linkedin", "profile"),
      },
      {
        label: "Connect Page",
        type: "page",
        href: connectHref("linkedin", "page"),
      },
    ],
  },
  {
    id: "YOUTUBE",
    name: "YouTube",
    actions: [
      {
        label: "Connect Channel",
        type: "channel",
        href: connectHref("youtube", "channel"),
      },
    ],
  },
  {
    id: "TIKTOK",
    name: "TikTok",
    actions: [
      {
        label: "Connect Business",
        type: "business",
        href: connectHref("tiktok", "business"),
      },
    ],
  },
  {
    id: "X",
    name: "X",
    followUs: true,
    actions: [
      {
        label: "Connect Profile",
        type: "profile",
        href: connectHref("x", "profile"),
      },
    ],
  },
  {
    id: "PINTEREST",
    name: "Pinterest",
    actions: [
      {
        label: "Connect Board",
        type: "board",
        href: connectHref("pinterest", "board"),
      },
    ],
  },
];

const ERROR_MSG: Record<string, string> = {
  missing_code: "Connection could not be completed. Please try again.",
  state: "Session expired. Please connect again.",
  exchange: "Platform connection failed. Try again.",
  access_denied: "Permission denied.",
  platform: "Invalid platform.",
  limit: "Account limit reached. Buy additional accounts to connect more.",
};

export function ConnectPlatformCards({
  connectedProviders = [],
  atLimit = false,
}: {
  connectedProviders?: string[];
  readyProviders?: string[];
  atLimit?: boolean;
}) {
  const search = useSearchParams();
  const error = search.get("error");
  const soon = search.get("soon");
  const [followUs, setFollowUs] = useState(true);
  const connected = useMemo(
    () => new Set(connectedProviders.map((p) => p.toUpperCase())),
    [connectedProviders]
  );

  return (
    <div className="space-y-4">
      {error && ERROR_MSG[error] ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {ERROR_MSG[error]}
        </p>
      ) : null}
      {soon ? (
        <p className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          Google Business Profile is coming soon.
        </p>
      ) : null}
      {atLimit ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You’ve reached your account limit.{" "}
          <Link href="/pricing" className="font-semibold text-accent underline">
            Buy Additional
          </Link>{" "}
          to connect more profiles.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((p) => {
          const isLinked = connected.has(p.id);
          return (
            <div
              key={p.id}
              className={`relative flex flex-col items-center rounded-2xl border bg-white px-5 py-7 text-center shadow-[var(--shadow-soft)] ${
                isLinked
                  ? "border-emerald-300 ring-1 ring-emerald-100"
                  : "border-ink-200/80"
              }`}
            >
              {isLinked ? (
                <span className="absolute right-3 top-3 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Connected
                </span>
              ) : null}

              {p.id === "GBP" ? (
                <GoogleG size={40} />
              ) : (
                <ProviderIcon provider={p.id} size={40} />
              )}
              <h3 className="mt-3 text-[15px] font-semibold text-ink-900">{p.name}</h3>

              <div className="mt-3 flex w-full flex-col gap-1.5">
                {p.soon || atLimit ? (
                  <span className="text-sm font-medium text-ink-300">
                    {p.soon ? "Coming soon" : "Limit reached"}
                  </span>
                ) : (
                  p.actions.map((a) => {
                    const href =
                      p.followUs && !followUs
                        ? `${a.href}&follow=0`
                        : a.href;
                    return (
                      <a
                        key={a.label}
                        href={href}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        [ {a.label} ]
                      </a>
                    );
                  })
                )}
              </div>

              {p.followUs ? (
                <label className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                    checked={followUs}
                    onChange={(e) => setFollowUs(e.target.checked)}
                  />
                  Follow Us
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreateAccountHeader({
  accountCount = 0,
  accountLimit = 50,
}: {
  accountCount?: number;
  accountLimit?: number;
}) {
  const nearLimit = accountCount >= Math.max(1, accountLimit - 9);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link
          href="/accounts"
          className="text-sm font-semibold text-accent hover:underline"
        >
          &lt; Accounts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-900">
          Connect Account
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-500">
          Click a platform to open the official login and permission screen. Tokens
          are encrypted and stored for your workspace only.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            nearLimit
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-ink-200 bg-white text-ink-700"
          }`}
        >
          <span aria-hidden>⚠️</span>
          <span>
            {accountCount}/{accountLimit} Accounts Connected
          </span>
          <span className="text-ink-300">|</span>
          <Link href="/pricing" className="text-accent hover:underline">
            Buy Additional
          </Link>
        </div>
        <Link
          href="/accounts"
          className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function GoogleG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.9 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
