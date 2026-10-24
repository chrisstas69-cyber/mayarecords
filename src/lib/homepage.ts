import type { Release } from "./types";

export const HOME_DESTINATIONS = [
  {
    number: "01",
    title: "Members’ Edits",
    detail: "Private selections",
    href: "/members",
  },
  {
    number: "02",
    title: "Maya Catalog",
    detail: "The label archive",
    href: "/releases",
  },
  {
    number: "03",
    title: "DJ Mixes",
    detail: "Long-form journeys",
    href: "/mixes",
  },
  {
    number: "04",
    title: "About Joeski",
    detail: "New York roots",
    href: "/about",
  },
  {
    number: "05",
    title: "Press Feature",
    detail: "The Mixmag interview",
    href: "/#press-feature",
  },
  {
    number: "06",
    title: "Joeski Remixes",
    detail: "Beyond Maya",
    href: "/remixes",
  },
] as const;

export function latestHomeReleases(releases: Release[], today: string) {
  return releases
    .filter(
      (release) =>
        release.state === "published" &&
        (!release.release_date || release.release_date <= today),
    )
    .sort(
      (a, b) =>
        (b.release_date ?? "").localeCompare(a.release_date ?? "") ||
        b.catalog_number.localeCompare(a.catalog_number),
    )
    .slice(0, 4);
}
