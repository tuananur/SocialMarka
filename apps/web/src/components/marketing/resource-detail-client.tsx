"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  CtaBand,
  DetailHero,
  LinkTiles,
  SectionBlock,
  StepPreviewPanel,
  TimelineSteps,
  TipTiles,
} from "@/components/marketing/guide-chrome";
import type { ResourceGuide } from "@/lib/resources";
import { RESOURCE_CATEGORIES, RESOURCES } from "@/lib/resources";

export function ResourceDetailClient({ guide }: { guide: ResourceGuide }) {
  const router = useRouter();
  const others = RESOURCES.filter((r) => r.slug !== guide.slug);
  const categoryLabel =
    RESOURCE_CATEGORIES.find((c) => c.id === guide.category)?.label ?? "Rehber";
  const isFaq = guide.slug === "sss";

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <DetailHero
        backHref="/resources"
        backLabel="Tüm kaynaklar"
        kicker={`${categoryLabel} · Yol gösterici`}
        title={guide.headline}
        intro={guide.intro}
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              className="font-semibold shadow-lg shadow-accent/25"
              onPress={() => router.push("/register")}
            >
              Ücretsiz Dene
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onPress={() => {
                document
                  .getElementById(isFaq ? "sss" : "adimlar")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {isFaq ? "Sorulara in" : "Adımlara in"}
            </Button>
          </>
        }
        aside={
          isFaq ? undefined : (
            <StepPreviewPanel label="Bu rehberde" steps={guide.steps} />
          )
        }
      />

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-14">
        {isFaq ? (
          <FaqAccordion items={guide.sections} defaultOpenIndex={0} />
        ) : (
          <div className="space-y-5">
            {guide.sections.map((s, i) => (
              <SectionBlock
                key={s.title}
                index={i + 1}
                title={s.title}
                body={s.body}
                invert={i % 2 === 1}
              />
            ))}
          </div>
        )}

        <div id="adimlar">
          <TimelineSteps
            title={isFaq ? "Hâlâ takılıyorsanız" : "Adım adım nasıl yapılır?"}
            subtitle={
              isFaq
                ? "SSS’de bulamadığınız sorular için bu sırayı izleyin — rehber, deneme, iletişim."
                : "Ekranda ne göreceğinizi ve hangi sırayla ilerleyeceğinizi anlatıyoruz — kısa başlık değil, uygulanabilir yol tarifi."
            }
            steps={guide.steps}
          />
        </div>

        <TipTiles tips={guide.tips} />

        <LinkTiles
          title="İlgili sayfalar"
          items={guide.related.map((r) => ({ title: r.title, href: r.href }))}
        />

        <LinkTiles
          title="Diğer rehberler"
          items={others.slice(0, 6).map((r) => ({
            title: r.shortTitle,
            href: `/resources/${r.slug}`,
            desc: r.menuDesc,
          }))}
        />

        <CtaBand
          title="Uygulamaya geçin"
          desc="Rehberi okudunuz — çalışma alanınızı açıp deneyin."
        >
          <Button
            variant="secondary"
            className="bg-white font-semibold text-accent"
            onPress={() => router.push("/register")}
          >
            Ücretsiz Dene
          </Button>
          <Button
            variant="outline"
            className="border-white/40 text-white"
            onPress={() => router.push("/login")}
          >
            Giriş Yap
          </Button>
        </CtaBand>
      </main>
    </div>
  );
}
