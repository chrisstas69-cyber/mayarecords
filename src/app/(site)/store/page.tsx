import type { Metadata } from "next";
import { StoreFront } from "@/components/site/StoreFront";
import { getActiveProducts, getPublishedReleases } from "@/lib/data/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Store",
  description: "Official Joeski / Maya Records merch and digital downloads — every release as MP3 + WAV, direct from the label.",
};

export default async function StorePage() {
  const [products, releases] = await Promise.all([getActiveProducts(), getPublishedReleases()]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-16">
        <p className="eyebrow mb-3">Direct from the label</p>
        <h1 className="display-lg text-cream">Store</h1>
        <p className="mt-4 max-w-xl text-sand">
          Merch and music, no middlemen. Digital purchases include MP3 and WAV, delivered the moment you pay.
        </p>
      </header>
      <StoreFront products={products} releases={releases} />
    </div>
  );
}
