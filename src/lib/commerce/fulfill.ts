import "server-only";

import Stripe from "stripe";
import { privateMasterPath } from "@/lib/commerce/pricing";
import { createServiceClient } from "@/lib/supabase/server";

export interface FulfilledOrder {
  orderId: string;
  email: string | null;
  merchItems: Array<{ title: string; variant: string | null; quantity: number }>;
  downloads: Array<{ token: string; title: string; expiresAt: string }>;
}

interface FulfillmentItem {
  stripe_line_item_id: string;
  item_type: "merch" | "digital_release" | "digital_track";
  product_id: string | null;
  release_id: string | null;
  track_id: string | null;
  title: string;
  variant: string | null;
  quantity: number;
  unit_price_cents: number;
  master_url: string | null;
}

/** Stripe verifies payment; one service-only RPC commits the complete order. */
export async function fulfillCheckoutSession(sessionId: string): Promise<{ order?: FulfilledOrder; error?: string }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { error: "Stripe is not configured." };
  const supabase = createServiceClient();
  if (!supabase) return { error: "Supabase service credentials are not configured — orders can't be recorded." };

  const stripe = new Stripe(stripeKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { error: "We couldn't find that checkout session." };
  }
  if (session.payment_status !== "paid") return { error: "This order hasn't been paid yet." };
  if (session.mode !== "payment") return { error: "This checkout session isn't a store purchase." };

  try {
    const { data: existing, error: existingError } = await supabase
      .from("orders")
      .select("id, email, status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    // Paid links remain usable if the catalog is edited after fulfillment.
    if (existing?.status === "fulfilled") return { order: await loadOrder(supabase, existing.id, existing.email) };
    if (existing && existing.status !== "paid" && existing.status !== "pending") {
      return { error: "This order cannot be fulfilled in its current state." };
    }

    const lines: Stripe.LineItem[] = [];
    const lineIds = new Set<string>();
    let startingAfter: string | undefined;
    while (true) {
      const page = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 50,
        expand: ["data.price.product"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const line of page.data) {
        if (!line.id || lineIds.has(line.id) || lines.length >= 50) throw new Error("Invalid or oversized checkout cart.");
        lineIds.add(line.id);
        lines.push(line);
      }
      if (!page.has_more) break;
      if (!page.data.length || lines.length >= 50) throw new Error("Invalid or oversized checkout cart.");
      startingAfter = page.data[page.data.length - 1].id;
    }
    if (!lines.length) throw new Error("This checkout session has no items.");

    const items: FulfillmentItem[] = [];
    for (const line of lines) {
      const product = line.price?.product;
      if (!product || typeof product === "string" || product.deleted) throw new Error("Checkout product details are unavailable.");
      const meta = product.metadata;
      const itemType = meta.item_type;
      if (itemType !== "merch" && itemType !== "digital_release" && itemType !== "digital_track") {
        throw new Error("Unknown checkout item type.");
      }
      const quantity = line.quantity;
      const unitPrice = line.price?.unit_amount;
      if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647 ||
          typeof unitPrice !== "number" || !Number.isSafeInteger(unitPrice) || unitPrice < 0 || unitPrice > 2147483647 ||
          line.currency !== session.currency || (itemType !== "merch" && quantity !== 1)) {
        throw new Error("Invalid checkout line item.");
      }

      let masterUrl: string | null = null;
      if (itemType !== "merch") {
        if (!meta.release_id) throw new Error("Missing checkout release.");
        const { data: release, error: releaseError } = await supabase
          .from("releases").select("id, state, master_url").eq("id", meta.release_id).maybeSingle();
        if (releaseError) throw new Error(releaseError.message);
        if (!release || release.state !== "published") throw new Error("The purchased release is no longer published. Contact the label.");

        let master = release.master_url as string | null;
        if (itemType === "digital_track") {
          if (!meta.track_id) throw new Error("Missing checkout track.");
          const { data: track, error: trackError } = await supabase
            .from("tracks").select("id, release_id, master_url").eq("id", meta.track_id).maybeSingle();
          if (trackError) throw new Error(trackError.message);
          if (!track || track.release_id !== release.id) throw new Error("The purchased track doesn't belong to this release.");
          master = track.master_url;
        }
        const path = privateMasterPath(master);
        if (!path) throw new Error("The purchased master is unavailable. Contact the label.");
        masterUrl = "masters/" + path;
      } else if (!meta.product_id) {
        throw new Error("Missing checkout product.");
      }

      items.push({
        stripe_line_item_id: line.id,
        item_type: itemType,
        product_id: itemType === "merch" ? meta.product_id : null,
        release_id: itemType !== "merch" ? meta.release_id : null,
        track_id: itemType === "digital_track" ? meta.track_id : null,
        title: product.name || line.description || "Item",
        variant: itemType === "merch" ? meta.size || null : "MP3 + WAV",
        quantity,
        unit_price_cents: unitPrice,
        master_url: masterUrl,
      });
    }

    const { data: orderId, error: fulfillmentError } = await supabase.rpc("fulfill_paid_checkout", {
      p_stripe_session_id: session.id,
      p_email: session.customer_details?.email ?? null,
      p_amount_total_cents: session.amount_total,
      p_currency: session.currency,
      p_items: items,
    });
    if (fulfillmentError) throw new Error(fulfillmentError.message);
    if (typeof orderId !== "string" || !orderId) throw new Error("The order could not be recorded.");
    return { order: await loadOrder(supabase, orderId, session.customer_details?.email ?? null) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not fulfill this order. Please retry or contact the label." };
  }
}

async function loadOrder(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  orderId: string,
  email: string | null
): Promise<FulfilledOrder> {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("id, item_type, title, variant, quantity, download_tokens(token, expires_at)")
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);

  const merchItems: FulfilledOrder["merchItems"] = [];
  const downloads: FulfilledOrder["downloads"] = [];
  for (const item of items ?? []) {
    if (item.item_type === "digital_release" || item.item_type === "digital_track") {
      type DownloadToken = { token: string; expires_at: string };
      const embedded = item.download_tokens as DownloadToken | DownloadToken[] | null;
      const tokens = Array.isArray(embedded) ? embedded : embedded ? [embedded] : [];
      for (const t of tokens) {
        downloads.push({ token: t.token, title: item.title, expiresAt: t.expires_at });
      }
    } else {
      merchItems.push({ title: item.title, variant: item.variant, quantity: item.quantity });
    }
  }
  return { orderId, email, merchItems, downloads };
}
