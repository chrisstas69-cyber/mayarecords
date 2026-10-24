import type { Metadata } from "next";
import { homeSerif as serif, homeSans as sans } from "@/lib/home-fonts";
import { HomePageLanding } from "@/components/site/HomePageLanding";
import {
  getPublishedMixes,
  getPublishedReleases,
  getSiteSettings,
} from "@/lib/data/catalog";
import { getReleasedEdits } from "@/lib/members";
import { latestHomeReleases } from "@/lib/homepage";
import { selectMixes } from "@/lib/mixes";
import { canonicalSoundCloudTrack } from "@/lib/soundcloud";
import { resolvePromotion } from "@/lib/promotion";
import "../homepage.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { images: ["/images/portraits/joeski-iconic.webp"] },
};
export default async function HomePage() {
  const [releases, settings, mixes] = await Promise.all([
    getPublishedReleases(),
    getSiteSettings(),
    getPublishedMixes(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const latest = latestHomeReleases(releases, today);
  const mix =
    selectMixes(mixes).find((item) =>
      canonicalSoundCloudTrack(item.external_url),
    ) ?? null;
  const edits = getReleasedEdits()
    .slice(0, 3)
    .map(({ slug, title, original_artist }) => ({
      slug,
      title,
      original_artist,
    }));
  return (
    <div className={`${serif.variable} ${sans.variable} home-fonts`}>
      <HomePageLanding
        releases={latest}
        edits={edits}
        mix={mix}
        promotion={resolvePromotion(settings.promotion, releases, today)}
      />
    </div>
  );
}
