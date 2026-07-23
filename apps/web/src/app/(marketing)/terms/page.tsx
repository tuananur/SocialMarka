import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";

export const metadata: Metadata = {
  title: "Terms of Service — SocialMarka",
  description: "Terms of Service for SocialMarka social media management platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold text-accent">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-950">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-ink-500">Last updated: July 23, 2026</p>

        <div className="prose-sm mt-10 space-y-6 text-ink-700">
          <p>
            SocialMarka (“we”, “our”, or “the Service”) is a social media management
            platform that helps users connect social accounts, schedule and publish
            content, and manage engagement from a single dashboard.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">1. Acceptance</h2>
          <p>
            By creating an account or using SocialMarka, you agree to these Terms.
            If you do not agree, do not use the Service.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">2. Accounts</h2>
          <p>
            You are responsible for your login credentials and for activity under
            your workspace. You must provide accurate information and keep it updated.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">
            3. Connected platforms
          </h2>
          <p>
            When you connect TikTok or other platforms, you authorize SocialMarka to
            access data and perform actions permitted by those platforms’ APIs and
            your granted scopes (for example login identity and content posting).
            You remain responsible for complying with each platform’s policies.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">4. Acceptable use</h2>
          <p>
            You may not use SocialMarka to spam, harass, infringe rights, violate
            laws, or abuse third-party APIs. We may suspend accounts that breach
            these Terms.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">5. Content</h2>
          <p>
            You retain ownership of content you upload or publish. You grant us a
            limited license to process and transmit that content solely to operate
            the Service (scheduling, publishing, previews, and support).
          </p>
          <h2 className="text-lg font-semibold text-ink-950">6. Availability</h2>
          <p>
            The Service is provided “as is”. We aim for high availability but do not
            guarantee uninterrupted operation.
          </p>
          <h2 className="text-lg font-semibold text-ink-950">7. Contact</h2>
          <p>
            Questions:{" "}
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
