import type { Release } from "./types";

export interface PromotionConfig {
  enabled: boolean;
  kind: "release" | "presale" | "merch" | "campaign";
  release_slug: string;
  badge: string;
  title: string;
  description: string;
  image_url: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
}

export const PROMOTION_DEFAULTS: PromotionConfig = {
  enabled: true,
  kind: "release",
  release_slug: "",
  badge: "",
  title: "",
  description: "",
  image_url: "",
  primary_label: "View release",
  primary_url: "",
  secondary_label: "",
  secondary_url: "",
};

export function safePublicUrl(value: string): boolean {
  if (/^\/(?!\/)/.test(value)) return !/[\\\s\u0000-\u001f]/.test(value);
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !/[\\\s\u0000-\u001f]/.test(value)
    );
  } catch {
    return false;
  }
}

export function validatePromotion(value: unknown): {
  value?: PromotionConfig;
  error?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { error: "Promotion must be an object." };
  const raw = value as Record<string, unknown>;
  const result = { ...PROMOTION_DEFAULTS };
  if (raw.enabled !== undefined && typeof raw.enabled !== "boolean")
    return { error: "Invalid promotion visibility." };
  result.enabled = raw.enabled === undefined ? true : raw.enabled;
  if (
    raw.kind !== undefined &&
    (typeof raw.kind !== "string" ||
      !["release", "presale", "merch", "campaign"].includes(raw.kind))
  )
    return { error: "Invalid promotion type." };
  result.kind = (raw.kind ?? "release") as PromotionConfig["kind"];
  for (const key of [
    "release_slug",
    "badge",
    "title",
    "description",
    "image_url",
    "primary_label",
    "primary_url",
    "secondary_label",
    "secondary_url",
  ] as const) {
    if (raw[key] !== undefined && typeof raw[key] !== "string")
      return { error: `Invalid promotion field: ${key}.` };
    result[key] = typeof raw[key] === "string" ? raw[key].trim() : result[key];
    const limit = key.endsWith("url")
      ? 2000
      : key === "description"
        ? 500
        : 120;
    if (result[key].length > limit)
      return { error: `${key.replaceAll("_", " ")} is too long.` };
  }
  for (const key of ["image_url", "primary_url", "secondary_url"] as const) {
    if (result[key] && !safePublicUrl(result[key]))
      return {
        error: "Use a site path beginning with / or a public HTTPS URL.",
      };
  }
  if (result.release_slug && !/^[a-z0-9-]+$/.test(result.release_slug))
    return { error: "Use the release slug, such as maya264." };
  if (
    result.enabled &&
    result.kind !== "release" &&
    (!result.title || !result.primary_label || !result.primary_url)
  ) {
    return {
      error:
        "Presales, merch and campaigns need a title, button label and destination URL.",
    };
  }
  if (Boolean(result.secondary_label) !== Boolean(result.secondary_url))
    return {
      error:
        "Provide both the second button label and URL, or leave both empty.",
    };
  return { value: result };
}

export function readPromotion(
  value: unknown,
  fallback: PromotionConfig = PROMOTION_DEFAULTS,
): PromotionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fallback;
  return validatePromotion({ ...fallback, ...value }).value ?? fallback;
}

export function resolvePromotion(
  config: PromotionConfig,
  releases: Release[],
  today: string,
) {
  if (!config.enabled) return null;
  const dated = releases
    .filter((release) => release.state === "published")
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
  const upcoming = dated
    .filter((release) => release.release_date && release.release_date > today)
    .sort((a, b) => a.release_date!.localeCompare(b.release_date!))[0];
  const selected = config.release_slug
    ? dated.find((release) => release.slug === config.release_slug)
    : (upcoming ?? (config.kind === "release" ? dated[0] : undefined));
  const release =
    config.kind === "release" || config.kind === "presale"
      ? selected
      : undefined;
  if (config.kind === "release" && !release) return null;
  return {
    title: config.title || release?.title || "",
    description: config.description,
    subtitle:
      release?.artist_name ??
      (config.kind === "merch"
        ? "Official merchandise"
        : "Joeski · Maya Records"),
    badge:
      config.badge ||
      (config.kind === "release"
        ? release?.release_date && release.release_date > today
          ? "Upcoming release"
          : "Latest release"
        : config.kind === "presale"
          ? "Presale"
          : config.kind === "merch"
            ? "Merch spotlight"
            : "In the spotlight"),
    image: config.image_url || release?.cover_url || null,
    href:
      config.primary_url || (release ? `/releases/${release.slug}` : "/store"),
    label: config.primary_label || "View release",
    secondaryLabel: config.secondary_label,
    secondaryHref: config.secondary_url,
    release,
  };
}

export type ResolvedPromotion = NonNullable<
  ReturnType<typeof resolvePromotion>
>;
