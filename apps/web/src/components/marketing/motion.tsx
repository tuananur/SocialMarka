"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "fade" | "scale" | "slide-left";
  once?: boolean;
  as?: "div" | "section" | "article";
};

/** Scroll reveal — viewport’taysa hemen görünür; asla sonsuza kadar gizli kalmaz */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up",
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => setVisible(true);

    const inView = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.98 && rect.bottom > 0;
    };

    if (inView()) {
      show();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          if (once) io.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "40px 0px" }
    );
    io.observe(el);

    // Güvenlik: animasyon takılırsa içerik yine de görünsün
    const fallback = window.setTimeout(show, 600);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [once]);

  const classes = [
    "reveal",
    `reveal-${variant}`,
    visible ? "is-visible" : null,
    className || null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref as never}
      className={classes}
      style={{ transitionDelay: `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
