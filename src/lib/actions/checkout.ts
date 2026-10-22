"use server";

import Stripe from "stripe";
import { getActiveProducts, getPublishedReleases } from "@/lib/data/catalog";
import type { CartItem } from "@/lib/types";
import type { ActionResult } from "./releases";
import { buildCheckoutItems } from "@/lib/commerce/checkout-items";
import { createServiceClient } from "@/lib/supabase/server";

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
  if (!Array.isArray(items) || items.length === 0) return { ok: false, error: "Your cart is empty." };

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      error: "Checkout isn't available yet. Please check back soon.",
    };
  }

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "Checkout is not available yet. Please check back soon." };

  const [products, releases] = await Promise.all([getActiveProducts(), getPublishedReleases()]);

  const validated = buildCheckoutItems(items, products, releases);
  if (!validated.ok) return validated;
  const availability = await Promise.all(validated.items.filter((i) => i.masterPath).map(async (item) => {
    const { error } = await supabase.storage.from("masters").createSignedUrl(item.masterPath!, 60);
    return !error;
  }));
  if (availability.some((available) => !available)) return { ok: false, error: "A download in your cart isn't ready yet. Please check back soon." };
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validated.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: item.currency, unit_amount: item.priceCents,
      product_data: { name: item.name, metadata: item.metadata },
    },
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/store`,
      ...(validated.items.some((i) => i.metadata.item_type === "merch") ? { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "DE", "FR", "ES", "NL", "MX", "CO", "BR"] } } : {}),
    });
    if (!session.url) return { ok: false, error: "Stripe didn't return a checkout URL." };
    return { ok: true, data: { url: session.url } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start checkout." };
  }
}
