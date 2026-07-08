import type { MetadataRoute } from "next";
import { getArtists, getPublishedReleases } from "@/lib/data/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [releases, artists] = await Promise.all([getPublishedReleases(), getArtists()]);

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/releases`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/mixes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/store`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/artists`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/press`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...releases.map((r) => ({
      url: `${base}/releases/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...artists.map((a) => ({
      url: `${base}/artists/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
