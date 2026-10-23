import type { Metadata } from "next";
import { CatalogLanding } from "@/components/site/CatalogLanding";
import { getPublishedReleases, getSiteSettings } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Releases",
  description:
    "The complete Maya Records catalog — tribal, deep and tech house from New York since 2001.",
};

export default async function ReleasesPage() {
  const [releases, settings] = await Promise.all([
    getPublishedReleases(),
    getSiteSettings(),
  ]);
  return <CatalogLanding releases={releases} promotion={settings.promotion} />;
}
