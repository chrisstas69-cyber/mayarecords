"use server";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_COOKIE, MEMBER_COOKIE, isStripeMembershipConfigured } from "@/lib/members";
import type { ActionResult } from "./releases";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : null;
}

/** Adds a fan to the mailing list. Supabase `fans` table when configured, local JSONL file otherwise. */
async function recordFan(email: string, source: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase!.from("fans").upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });
    return !error;
  }
  try {
    const dir = path.join(process.cwd(), "private-media");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "fans.jsonl"), JSON.stringify({ email, source, at: new Date().toISOString() }) + "\n");
    return true;
  } catch {
    return false;
  }
}

export async function joinMailingList(rawEmail: string): Promise<ActionResult> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: false, error: "That email doesn't look right." };
  const saved = await recordFan(email, "members-page");
  return saved ? { ok: true } : { ok: false, error: "Couldn't save your email — try again in a minute." };
}

export async function startMembershipCheckout(rawEmail: string): Promise<ActionResult<{ url: string }>> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: false, error: "Enter your email to join." };

  await recordFan(email, "membership-checkout");

  if (!isStripeMembershipConfigured()) {
    return {
      ok: false,
      error: "Memberships aren't connected to Stripe yet. (Set STRIPE_SECRET_KEY and STRIPE_MEMBERS_PRICE_ID.)",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_MEMBERS_PRICE_ID!, quantity: 1 }],
    success_url: `${siteUrl}/api/members/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/members`,
    allow_promotion_codes: true,
  });
  if (!session.url) return { ok: false, error: "Stripe didn't return a checkout link." };
  return { ok: true, data: { url: session.url } };
}

export async function enableDemoAccess(): Promise<ActionResult> {
  if (isStripeMembershipConfigured()) return { ok: false, error: "Demo access is off once billing is live." };
  const jar = await cookies();
  jar.set(DEMO_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return { ok: true };
}

export async function signOutMember(): Promise<ActionResult> {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
  jar.delete(MEMBER_COOKIE);
  return { ok: true };
}
