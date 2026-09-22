import "server-only";

import { cookies } from "next/headers";
import Stripe from "stripe";
import { EDITS_DATA } from "@/lib/data/edits.generated";

/**
 * Joeski Members — $10/mo gives DJs every Joeski edit (one new drop a week).
 *
 * Access is granted by either:
 *  - a Stripe subscription (cookie holds the subscription id, status checked live), or
 *  - demo access (local only, until Stripe is connected).
 */

export const MEMBER_COOKIE = "jm_sub";
export const DEMO_COOKIE = "jm_demo";
export const MEMBERSHIP_PRICE_LABEL = "$10";

export interface Edit {
  slug: string;
  title: string;
  original_artist: string;
  drop_date: string;
  duration_seconds: number;
  cover_url: string;
  preview_url: string;
  wav_bytes: number;
}

export const EDITS: Edit[] = [...EDITS_DATA];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Released edits, newest first. */
export function getReleasedEdits(): Edit[] {
  const now = today();
  return EDITS.filter((e) => e.drop_date <= now).sort((a, b) => b.drop_date.localeCompare(a.drop_date));
}

/** Upcoming edits, soonest first. */
export function getUpcomingEdits(): Edit[] {
  const now = today();
  return EDITS.filter((e) => e.drop_date > now).sort((a, b) => a.drop_date.localeCompare(b.drop_date));
}

export function getEdit(slug: string): Edit | undefined {
  return EDITS.find((e) => e.slug === slug);
}

export function isEditReleased(edit: Edit): boolean {
  return edit.drop_date <= today();
}

export function isStripeMembershipConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_MEMBERS_PRICE_ID);
}

export type MemberAccess = { member: true; via: "subscription" | "demo" } | { member: false };

export async function getMemberAccess(): Promise<MemberAccess> {
  const jar = await cookies();

  const subId = jar.get(MEMBER_COOKIE)?.value;
  if (subId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const sub = await stripe.subscriptions.retrieve(subId);
      if (sub.status === "active" || sub.status === "trialing") return { member: true, via: "subscription" };
    } catch {
      // Unknown or deleted subscription — fall through to no access.
    }
  }

  // Demo access only exists while real billing isn't wired up.
  if (!isStripeMembershipConfigured() && jar.get(DEMO_COOKIE)?.value === "1") {
    return { member: true, via: "demo" };
  }

  return { member: false };
}
