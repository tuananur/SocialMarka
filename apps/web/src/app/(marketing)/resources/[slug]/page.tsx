import { notFound } from "next/navigation";
import { ResourceDetailClient } from "@/components/marketing/resource-detail-client";
import { getResource, RESOURCES } from "@/lib/resources";

export function generateStaticParams() {
  return RESOURCES.map((r) => ({ slug: r.slug }));
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getResource(slug);
  if (!guide) notFound();
  return <ResourceDetailClient guide={guide} />;
}
