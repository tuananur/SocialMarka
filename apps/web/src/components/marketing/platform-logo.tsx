"use client";

import { useId } from "react";
import type { PlatformSlug } from "@/lib/platforms";

type Props = {
  slug: PlatformSlug;
  size?: number;
  className?: string;
};

export function PlatformLogo({ slug, size = 24, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const common = {
    width: size,
    height: size,
    className,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (slug) {
    case "tiktok":
      return (
        <svg {...common}>
          <path
            fill="#25F4EE"
            transform="translate(1.2,0)"
            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.77a8.2 8.2 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
          />
          <path
            fill="#FE2C55"
            transform="translate(-1.2,0)"
            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.77a8.2 8.2 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
          />
          <path
            fill="#000"
            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.77a8.2 8.2 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={`ig-${uid}`} cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#ig-${uid})`} />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.15" fill="#fff" />
          <rect
            x="3.8"
            y="3.8"
            width="16.4"
            height="16.4"
            rx="5"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="#0F1419">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#0A66C2" />
          <path
            fill="#fff"
            d="M8.2 9.6H5.7V18h2.5V9.6ZM6.95 5.5a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9ZM18.3 12.1c0-2.05-1.1-3.37-3.22-3.37-1.08 0-1.8.55-2.12 1.17h-.05V9.6h-2.4c.03.7 0 8.4 0 8.4h2.5v-4.69c0-.25.02-.5.1-.68.2-.5.66-1.02 1.43-1.02.98 0 1.37.74 1.37 1.83V18h2.5v-5.9Z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path
            fill="#FF0000"
            d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8Z"
          />
          <path fill="#fff" d="M9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#E60023" />
          <path
            fill="#fff"
            d="M12.1 6.2c-3.1 0-5.3 2-5.3 4.7 0 1.6.8 3.1 2.4 3.6.2.1.4 0 .4-.2l.2-.7c.1-.2 0-.3-.1-.5-.4-.5-.6-1.1-.6-1.9 0-2.4 1.8-4.2 4.3-4.2 2.3 0 3.7 1.4 3.7 3.4 0 2.4-1.2 4.1-2.9 4.1-.9 0-1.6-.7-1.4-1.7.3-1.1.8-2.3.8-3.1 0-.7-.4-1.3-1.2-1.3-1 0-1.7 1-1.7 2.3 0 .8.3 1.3.3 1.3l-1 4.2c-.3 1.2 0 2.7 0 2.8 0 .1.1.1.2.1.1-.2 1.5-1.8 1.9-3.5.1-.5.7-2.6.7-2.6.4.7 1.4 1.2 2.5 1.2 3.2 0 5.2-2.8 5.2-6.1 0-3.1-2.6-5.5-6.1-5.5Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function PlatformBadge({
  slug,
  size = 36,
  className = "",
}: {
  slug: PlatformSlug;
  size?: number;
  className?: string;
}) {
  const padded = Math.round(size * 0.62);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ width: size, height: size }}
    >
      <PlatformLogo slug={slug} size={padded} />
    </span>
  );
}
