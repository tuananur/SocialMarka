import { notFound } from "next/navigation";
import { FeatureDetailClient } from "@/components/marketing/feature-detail-client";
import { FEATURES, getFeature } from "@/lib/features";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) notFound();
  return <FeatureDetailClient feature={feature} />;
}
