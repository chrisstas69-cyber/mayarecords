import type { Product, Release } from "../types";
import { isCartItem, normalizeCart } from "./cart";
import { privateMasterPath, trackPrice } from "./pricing";

export interface CheckoutItem {
  name: string;
  currency: string;
  priceCents: number;
  quantity: number;
  metadata: Record<string, string>;
  masterPath?: string;
}

export function buildCheckoutItems(input: unknown, products: Product[], releases: Release[]):
  { ok: true; items: CheckoutItem[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50 || !input.every(isCartItem)) {
    return { ok: false, error: "Your cart is invalid. Please remove the items and add them again." };
  }
  const items: CheckoutItem[] = [];
  for (const item of normalizeCart(input)) {
    if (item.kind === "merch") {
      const product = products.find((p) => p.id === item.productId && p.active);
      if (!product || item.quantity > 99 || (product.sizes.length > 0 && !product.sizes.includes(item.size ?? ""))) {
        return { ok: false, error: "A product or selected size is no longer available." };
      }
      items.push({
        name: product.name + (item.size ? ` — ${item.size}` : ""), currency: product.currency,
        priceCents: product.price_cents, quantity: item.quantity,
        metadata: { item_type: "merch", product_id: product.id, size: item.size ?? "" },
      });
      continue;
    }
    const release = releases.find((r) => r.id === item.releaseId && r.state === "published");
    if (!release) return { ok: false, error: "A release in your cart is no longer available." };
    const track = item.kind === "digital_track" ? release.tracks.find((t) => t.id === item.trackId) : undefined;
    if (item.kind === "digital_track" && !track) return { ok: false, error: "That track is not part of this release." };
    const price = track ? trackPrice(track) : release.digital_price_cents;
    const masterPath = privateMasterPath(track ? track.master_url : release.master_url);
    if (!price || !Number.isSafeInteger(price) || price <= 0) return { ok: false, error: "This download is not currently for sale." };
    if (!masterPath) return { ok: false, error: "This download isn't ready yet. Please check back soon." };
    items.push({
      name: `${track ? `${track.title} — ${release.title}` : `${release.title} (Full release)`} — ${release.artist_name ?? "Maya Records"} (${release.catalog_number}) · MP3 + WAV`,
      currency: "usd", priceCents: price, quantity: 1, masterPath,
      metadata: { item_type: track ? "digital_track" : "digital_release", release_id: release.id, ...(track ? { track_id: track.id } : {}) },
    });
  }
  return { ok: true, items };
}
