import type { Metadata } from "next";
import { MixLibrary } from "@/components/mixes/MixLibrary";
import { getPublishedMixes } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "DJ Mixes & Radio",
  description:
    "Explore Joeski’s DJ mix archive: full-length live sets, Maya Sessions, radio shows and studio sessions with original artwork and SoundCloud listening.",
  alternates: { canonical: "/mixes" },
};

export default async function MixesPage() {
  return <MixLibrary mixes={await getPublishedMixes()} />;
}
