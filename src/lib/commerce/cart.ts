import type { CartItem } from "../types";

export function itemKey(item: CartItem): string {
  if (item.kind === "merch") return `merch:${item.productId}:${item.size ?? ""}`;
  if (item.kind === "digital_track") return `track:${item.releaseId}:${item.trackId}`;
  return `release:${item.releaseId}`;
}

export function normalizeCart(items: CartItem[]): CartItem[] {
  const releases = new Set(items.filter((i) => i.kind === "digital_release").map((i) => i.releaseId));
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.kind === "digital_track" && releases.has(item.releaseId)) return false;
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.findIndex((i) => itemKey(i) === itemKey(item));
  if (existing >= 0 && item.kind === "merch") {
    return items.map((i, index) => index === existing && i.kind === "merch" ? { ...i, quantity: i.quantity + 1 } : i);
  }
  return normalizeCart([...items, item]);
}

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.name !== "string" || !Number.isSafeInteger(item.priceCents) || Number(item.priceCents) <= 0) return false;
  if (item.kind === "merch") {
    return typeof item.productId === "string" && Number.isSafeInteger(item.quantity) && Number(item.quantity) > 0
      && (item.size === null || typeof item.size === "string")
      && (item.imageUrl === null || typeof item.imageUrl === "string");
  }
  return (item.kind === "digital_release" || (item.kind === "digital_track" && typeof item.trackId === "string" && typeof item.releaseTitle === "string"))
    && typeof item.releaseId === "string" && typeof item.artistName === "string" && typeof item.catalogNumber === "string"
    && (item.coverUrl === null || typeof item.coverUrl === "string");
}
