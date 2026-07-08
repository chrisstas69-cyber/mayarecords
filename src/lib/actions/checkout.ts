"use server";

import Stripe from "stripe";
import { getActiveProducts, getPublishedReleases } from "@/lib/data/catalog";
import type { CartItem } from "@/lib/types";
import type { ActionResult } from "./releases";

/**
 * Stripe Checkout. Prices are re-validated server-side against the catalog —
 * the client's cart only tells us WHAT to buy, never for how much.
 *
 * TODO(credentials): set STRIPE_SECRET_KEY in .env.local to enable checkout.
 */

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createCheckoutSession(items: CartItem[]): Promise<ActionResult<{ url: string }>> {
  if (items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (items.length > 50) return { ok: false, error: "Too many items in one order." };

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      error: "Checkout isn't connected yet — the store goes live once Stripe is configured. (Set STRIPE_SECRET_KEY.)",
    };
  }

  const [products, releases] = await Promise.all([getActiveProducts(), getPublishedReleases()]);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const digitalReleaseIds: string[] = [];

  for (const item of items) {
    if (item.kind === "merch") {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return { ok: false, error: `“${item.name}” is no longer available.` };
      if (product.sizes.length > 0 && !item.size)
        return { ok: false, error: `Pick a size for “${product.name}”.` };
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: product.currency,
          unit_amount: product.price_cents,
          product_data: {
            name: product.name + (item.size ? ` — ${item.size}` : ""),
            metadata: { item_type: "merch", product_id: product.id, size: item.size ?? "" },
          },
        },
      });
    } else {
      const release = releases.find((r) => r.id === item.releaseId);
      if (!release || !release.digital_price_cents)
        return { ok: false, error: `“${item.name}” isn't available as a download.` };
      digitalReleaseIds.push(release.id);
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: release.digital_price_cents,
          product_data: {
            name: `${release.title} — ${release.artist_name} (${release.catalog_number}) · MP3 + WAV`,
            metadata: { item_type: "digital_release", release_id: release.id },
          },
        },
      });
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/store`,
      metadata: { digital_release_ids: digitalReleaseIds.join(",") },
      ...(digitalReleaseIds.length === items.length ? {} : { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "DE", "FR", "ES", "NL", "MX", "CO", "BR"] } }),
    });
    if (!session.url) return { ok: false, error: "Stripe didn't return a checkout URL." };
    return { ok: true, data: { url: session.url } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start checkout." };
  }
}
