import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/** Tek aile — ince, modern, kalın his yok */
const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SocialMarka — Sosyal Medya Yönetim Platformu",
  description:
    "Tüm sosyal medya hesaplarınızı tek yerden yönetin. Planlayın, yayınlayın, etkileşime geçin.",
  other: {
    "tiktok-developers-site-verification": "vHdkJVCIpQ1o4YcttaDHkpAUMx6Hk0VL",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${figtree.variable} antialiased text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
