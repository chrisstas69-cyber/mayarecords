import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/site/CatalogBrowser";
import { getPublishedReleases } from "@/lib/data/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Releases",
  description: "The Maya Records catalog — tribal, deep and tech house from New York since 2001.",
};

export default async function ReleasesPage() {
  const releases = await getPublishedReleases();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14">
        <p className="eyebrow mb-3">Maya Records</p>
        <h1 className="display-lg text-cream">The Catalog</h1>
        <p className="mt-4 max-w-xl text-sand">
          Every release, from MAYA001 forward. Tribal, deep and tech house — released on its own terms since 2001.
        </p>
      </header>
      <CatalogBrowser releases={releases} />
    </div>
  );
}
