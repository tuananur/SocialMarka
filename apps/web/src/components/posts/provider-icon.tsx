import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, className, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

function FacebookIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.3 19.2v-6.5h2.2l.3-2.6h-2.5V8.5c0-.7.2-1.2 1.3-1.2h1.4V5c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2h-2.3v2.6h2.3v6.5h2.9z"
      />
    </Svg>
  );
}

function InstagramIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <defs>
        <radialGradient id="ig" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig)" />
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" r="1" fill="#fff" />
    </Svg>
  );
}

function LinkedInIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.1 9.4H4.6V19h2.5V9.4zM5.8 5A1.45 1.45 0 104 6.45 1.45 1.45 0 005.8 5zM19.4 12.7c0-2.5-1.3-4.1-3.5-4.1a3 3 0 00-2.7 1.5h-.1V9.4h-2.4c0 .7 0 9.6 0 9.6h2.5v-5.4c0-.3 0-.5.1-.7a1.9 1.9 0 011.8-1.3c1.3 0 1.8 1 1.8 2.4V19h2.5v-6.3z"
      />
    </Svg>
  );
}

function YouTubeIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path fill="#fff" d="M10 8.5v7l6-3.5-6-3.5z" />
    </Svg>
  );
}

function XIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <rect width="24" height="24" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M16.7 6h1.7l-3.7 4.2L19 18h-3.4l-2.7-3.5L9.5 18H7.8l4-4.5L7 6h3.5l2.4 3.2L16.7 6zm-.6 10.8h.9L9.9 7.1H8.9l7.2 9.7z"
      />
    </Svg>
  );
}

function TikTokIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M16.2 7.2c-.7-.5-1.2-1.2-1.4-2.1h-2.1v9.2a2.4 2.4 0 11-1.7-2.3V9.8a4.5 4.5 0 104.5 4.5V9.4c.8.6 1.8.9 2.8.9V8.2c-.8 0-1.5-.4-2.1-1z"
      />
      <path
        fill="#FE2C55"
        d="M16.2 7.6c-.7-.5-1.2-1.2-1.4-2.1h-1.6v8.8a2.4 2.4 0 11-1.7-2.3V9.4a4.5 4.5 0 104.5 4.5V9c.8.6 1.8.9 2.8.9V8.6c-.8 0-1.5-.4-2.1-1z"
        opacity="0.9"
      />
      <path
        fill="#fff"
        d="M14.6 6.1h-.8v9.1a2.4 2.4 0 11-1.7-2.3V11a4.5 4.5 0 103.9 4.5V7.7c.7.5 1.6.8 2.5.8V7c-.7 0-1.4-.3-2-.9-.4-.4-.7-.9-.9-1.5-.2-.5-.3-1-.4-1.5z"
      />
    </Svg>
  );
}

function PinterestIcon({ size, className, ...rest }: IconProps) {
  return (
    <Svg size={size} className={className} {...rest}>
      <circle cx="12" cy="12" r="12" fill="#E60023" />
      <path
        fill="#fff"
        d="M12.1 6.2c-3 0-4.6 2.1-4.6 4.4 0 1.3.5 2.4 1.5 2.8.2.1.3 0 .3-.1l.3-1c0-.1 0-.2-.1-.3-.3-.3-.4-.8-.4-1.3 0-1.7 1.3-3.2 3.3-3.2 1.8 0 2.8 1.1 2.8 2.6 0 2-.9 3.3-2.1 3.3-.7 0-1.2-.6-1-1.3.2-.8.6-1.7.6-2.3 0-.5-.3-.9-.9-.9-.7 0-1.3.7-1.3 1.7 0 .6.2 1 .2 1l-.8 3.3c-.2.9-.1 2.2-.1 2.3 0 .1.1.1.1 0 .2-.2 2.3-2.8 2.3-2.8.6.9 1.8 1.5 3.1 1.5 2.5 0 4.2-2.3 4.2-5.1 0-2.6-2.2-4.4-4.9-4.4z"
      />
    </Svg>
  );
}

function FallbackIcon({ size, className, label, ...rest }: IconProps & { label: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white ${className || ""}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

const ICONS: Record<string, (p: IconProps) => ReactNode> = {
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedInIcon,
  YOUTUBE: YouTubeIcon,
  X: XIcon,
  TWITTER: XIcon,
  TIKTOK: TikTokIcon,
  PINTEREST: PinterestIcon,
};

export function ProviderIcon({
  provider,
  size = 24,
  className,
}: {
  provider: string;
  size?: number;
  className?: string;
}) {
  const key = String(provider || "").toUpperCase();
  const Icon = ICONS[key];
  if (!Icon) {
    return <FallbackIcon size={size} className={className} label={key || "?"} />;
  }
  return <Icon size={size} className={className} />;
}

export function ProviderBadge({
  provider,
  size = 44,
  active = false,
}: {
  provider: string;
  size?: number;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-sm transition ${
        active
          ? "scale-105 ring-2 ring-amber-400 ring-offset-2"
          : "opacity-80 hover:scale-[1.02] hover:opacity-100"
      }`}
      style={{ width: size, height: size }}
    >
      <ProviderIcon provider={provider} size={size} className="rounded-full" />
    </span>
  );
}
