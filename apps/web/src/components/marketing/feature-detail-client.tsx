"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import {
  CtaBand,
  DetailHero,
  LinkTiles,
  SectionBlock,
  StepPreviewPanel,
  TimelineSteps,
} from "@/components/marketing/guide-chrome";
import type { FeatureGuide } from "@/lib/features";
import { FEATURES } from "@/lib/features";

export function FeatureDetailClient({ feature }: { feature: FeatureGuide }) {
  const router = useRouter();
  const others = FEATURES.filter((f) => f.slug !== feature.slug);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <DetailHero
        backHref="/features"
        backLabel="Tüm özellikler"
        kicker={feature.tag}
        title={feature.headline}
        intro={feature.intro}
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
              onPress={() => router.push("/platforms")}
            >
              Platformları gör
            </Button>
          </>
        }
        aside={
          <StepPreviewPanel
            label="Akış"
            steps={feature.steps.map((s) => ({ title: s.title }))}
          />
        }
      />

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-14">
        <div className="space-y-5">
          {feature.sections.map((s, i) => (
            <SectionBlock
              key={s.title}
              index={i + 1}
              title={s.title}
              body={s.body}
              invert={i % 2 === 1}
            />
          ))}
        </div>

        <TimelineSteps
          title="Nasıl kullanılır?"
          subtitle={feature.howToIntro}
          steps={feature.steps}
        />

        <LinkTiles
          title="İlgili"
          items={feature.related.map((r) => ({ title: r.title, href: r.href }))}
        />

        <LinkTiles
          title="Diğer özellikler"
          items={others.map((f) => ({
            title: f.title,
            href: `/features/${f.slug}`,
            desc: f.menuDesc,
          }))}
        />

        <CtaBand
          title={`${feature.title} ile başlayın`}
          desc="Kayıt olun, özelliği panelde hemen deneyin."
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
            onPress={() => router.push("/resources/baslangic")}
          >
            Başlangıç rehberi
          </Button>
        </CtaBand>
      </main>
    </div>
  );
}
