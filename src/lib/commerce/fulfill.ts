import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

export interface FulfilledOrder {
  orderId: string;
  email: string | null;
  merchItems: Array<{ title: string; variant: string | null; quantity: number }>;
  downloads: Array<{ token: string; title: string; expiresAt: string }>;
}

/**
 * Verifies a Stripe Checkout session and fulfills it exactly once:
 * records the order + items, and mints download tokens for digital releases.
 * Requires SUPABASE_SERVICE_ROLE_KEY (orders are written server-side only).
 */
export async function fulfillCheckoutSession(sessionId: string): Promise<{ order?: FulfilledOrder; error?: string }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { error: "Stripe is not configured." };
  const supabase = createServiceClient();
  if (!supabase) return { error: "Supabase service credentials are not configured — orders can't be recorded." };

  const stripe = new Stripe(stripeKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] });
  } catch {
    return { error: "We couldn't find that checkout session." };
  }

  if (session.payment_status !== "paid") return { error: "This order hasn't been paid yet." };

  // Idempotent: if we've already fulfilled this session, return the existing order.
  const { data: existing } = await supabase.from("orders").select("id, email").eq("stripe_session_id", session.id).maybeSingle();
  if (existing) return { order: await loadOrder(supabase, existing.id, existing.email) };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      email: session.customer_details?.email ?? null,
      stripe_session_id: session.id,
      status: "paid",
      amount_total_cents: session.amount_total,
      currency: session.currency ?? "usd",
    })
    .select("id, email")
    .single();
  if (orderError) return { error: orderError.message };

  for (const line of session.line_items?.data ?? []) {
    const product = line.price?.product as Stripe.Product | undefined;
    const meta = product?.metadata ?? {};
    const { data: item } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        item_type: meta.item_type === "digital_release" ? "digital_release" : "merch",
        product_id: meta.product_id || null,
        release_id: meta.release_id || null,
        title: product?.name ?? line.description ?? "Item",
        variant: meta.size || (meta.item_type === "digital_release" ? "MP3 + WAV" : null),
        quantity: line.quantity ?? 1,
        unit_price_cents: line.price?.unit_amount ?? 0,
      })
      .select("id, release_id")
      .single();

    if (item?.release_id) {
      await supabase.from("download_tokens").insert({ order_item_id: item.id, release_id: item.release_id });
    }
  }

  await supabase.from("orders").update({ status: "fulfilled" }).eq("id", order.id);
  return { order: await loadOrder(supabase, order.id, order.email) };
}

async function loadOrder(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  orderId: string,
  email: string | null
): Promise<FulfilledOrder> {
  const { data: items } = await supabase
    .from("order_items")
    .select("id, item_type, title, variant, quantity, download_tokens(token, expires_at)")
    .eq("order_id", orderId);

  const merchItems: FulfilledOrder["merchItems"] = [];
  const downloads: FulfilledOrder["downloads"] = [];
  for (const item of items ?? []) {
    if (item.item_type === "digital_release") {
      for (const t of (item.download_tokens as Array<{ token: string; expires_at: string }>) ?? []) {
        downloads.push({ token: t.token, title: item.title, expiresAt: t.expires_at });
      }
    } else {
      merchItems.push({ title: item.title, variant: item.variant, quantity: item.quantity });
    }
  }
  return { orderId, email, merchItems, downloads };
}
