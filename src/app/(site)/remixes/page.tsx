import type { Metadata } from "next";
import { DiscographyTabs } from "@/components/site/DiscographyTabs";
import { RemixBrowser } from "@/components/site/RemixBrowser";
import { JOESKI_REMIXES } from "@/lib/data/remixes";
import { remixLabels, remixYearRange } from "@/lib/remixes";

const years = remixYearRange(JOESKI_REMIXES);
const description = `Joeski remixes beyond Maya — ${JOESKI_REMIXES.length} remixes for other labels, ${years}. Explore artwork and buy on Traxsource or Beatport.`;

export const metadata: Metadata = {
  title: "Joeski Remixes",
  description,
  alternates: { canonical: "/remixes" },
  openGraph: { title: "Joeski Remixes", description, url: "/remixes" },
};

export default function RemixesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-10 border-b border-line pb-10">
        <p className="eyebrow mb-3">The other side of the catalog</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display-lg text-cream">Joeski Remixes</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-sand">
              Joeski remixes beyond Maya — {JOESKI_REMIXES.length} remixes for other labels, {years}.
            </p>
          </div>
          <p className="text-sm text-sand">{remixLabels(JOESKI_REMIXES).length} labels · One unmistakable groove.</p>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sand">
          Explore the sleeves, find your mix, and buy directly from Traxsource or Beatport.
          These releases are sold by their respective labels, separately from the Maya store.
        </p>
      </header>
      <DiscographyTabs active="remixes" />
      <RemixBrowser remixes={JOESKI_REMIXES} />
    </div>
  );
}
