import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";

export const metadata: Metadata = {
  title: "Privacy Policy — SocialMarka",
  description: "Privacy Policy for SocialMarka social media management platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold text-accent">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-950">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-ink-500">Last updated: July 23, 2026</p>

        <div className="prose-sm mt-10 space-y-6 text-ink-700">
          <p>
            This Privacy Policy explains how SocialMarka collects, uses, and shares
            information when you use our social media management website and related
            services.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">1. Data we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account data: name, email, password hash, workspace membership</li>
            <li>
              Connected account data: platform user IDs, display names, profile
              images, and OAuth access/refresh tokens (encrypted at rest)
            </li>
            <li>
              Content data: posts, media metadata, schedules, publish status, and
              inbox messages you manage through the Service
            </li>
            <li>Technical logs: IP, device/browser, and error diagnostics</li>
          </ul>
          <h2 className="text-lg font-semibold text-ink-950">2. How we use data</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Authenticate users and secure workspaces</li>
            <li>Connect TikTok and other platforms via official OAuth</li>
            <li>Schedule, publish, and track content on your behalf</li>
            <li>Provide support, prevent abuse, and improve the product</li>
          </ul>
          <h2 className="text-lg font-semibold text-ink-950">3. TikTok data</h2>
          <p>
            When you authorize TikTok Login / Content Posting, we receive only the
            scopes you approve (for example basic profile and video upload). We use
            this data to link your TikTok account and publish content you create in
            SocialMarka. We do not sell TikTok user data.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">4. Sharing</h2>
          <p>
            We share data with infrastructure providers (hosting, database) and with
            platforms you connect (TikTok, etc.) only as needed to perform the
            actions you request. We do not sell personal data.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">5. Retention</h2>
          <p>
            We keep account and content data while your workspace is active. You may
            disconnect platforms or request deletion by contacting us.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">6. Security</h2>
          <p>
            Access tokens are encrypted. Access is restricted to authorized systems
            and roles. No method of transmission is 100% secure.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">7. Your choices</h2>
          <p>
            You can disconnect social accounts, delete posts you control in the
            dashboard, or request account deletion via{" "}
            <a className="font-semibold text-accent" href="mailto:hello@socialmarka.com">
              hello@socialmarka.com
            </a>
            .
          </p>
          <h2 className="text-lg font-semibold text-ink-950">8. Contact</h2>
          <p>
            Privacy questions:{" "}
            <a className="font-semibold text-accent" href="mailto:hello@socialmarka.com">
              hello@socialmarka.com
            </a>{" "}
            ·{" "}
            <Link className="font-semibold text-accent" href="/contact">
              Contact page
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
