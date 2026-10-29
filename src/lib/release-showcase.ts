import bigChief from "../../data/big-chief-releases.json";
import micasa from "../../data/micasa-releases.json";

const examples = [
  { slug: "big-chief-peeping-tom", label: "Big Chief", labelHref: "/labels/big-chief", release: bigChief.find(r => r.catalogNumber === "BC007")! },
  { slug: "micasa-getting-thru-it", label: "Micasa", labelHref: "/labels/micasa", release: micasa.find(r => r.catalogNumber === "MICASA002")! },
];

export const RELEASE_SHOWCASES = examples.map(example => ({
  ...example,
  isDemo: true as const,
  audioUrl: null,
  videoUrl: null,
  scheduledDate: null,
  exampleReleasePriceCents: example.release.tracks.length <= 3 ? 499 : 599,
  exampleTrackPriceCents: 199,
}));
export type ReleaseShowcase = (typeof RELEASE_SHOWCASES)[number];
export const SHOWCASE_NOTICE = "Design demo only — historical artwork and track names are used to illustrate a future release campaign. This is not a reissue announcement, preorder or sale.";
