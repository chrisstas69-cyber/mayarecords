"use server";

import { cookies } from "next/headers";
import { EPK_COOKIE, makeAccessToken, promoterExists, savePromoter, type PromoterInput } from "@/lib/epk";
import type { ActionResult } from "./releases";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["Promoter", "Venue / Club", "Booking Agent", "Festival", "Press / Media", "Other"];

function clean(v: FormDataEntryValue | null, max = 200): string {
  return String(v ?? "").trim().slice(0, max);
}

async function grant(email: string) {
  const jar = await cookies();
  jar.set(EPK_COOKIE, makeAccessToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function registerPromoter(form: FormData): Promise<ActionResult> {
  const p: PromoterInput = {
    name: clean(form.get("name")),
    email: clean(form.get("email"), 254).toLowerCase(),
    company: clean(form.get("company")),
    role: clean(form.get("role")),
    city: clean(form.get("city")),
    country: clean(form.get("country")),
    phone: clean(form.get("phone"), 40) || undefined,
    website: clean(form.get("website")) || undefined,
    instagram: clean(form.get("instagram"), 80) || undefined,
    event_details: clean(form.get("event_details"), 1000) || undefined,
  };

  if (!p.name || !p.company || !p.city || !p.country) return { ok: false, error: "Please fill in all required fields." };
  if (!EMAIL_RE.test(p.email)) return { ok: false, error: "That email doesn't look right." };
  if (!ROLES.includes(p.role)) return { ok: false, error: "Pick what best describes you." };

  if (!(await savePromoter(p))) return { ok: false, error: "Couldn't save your details — try again in a minute." };
  await grant(p.email);
  return { ok: true };
}

export async function returningPromoter(rawEmail: string): Promise<ActionResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "That email doesn't look right." };
  if (!(await promoterExists(email))) {
    return { ok: false, error: "We don't have that email yet — register below to get access." };
  }
  await grant(email);
  return { ok: true };
}

export async function exitEpk(): Promise<ActionResult> {
  const jar = await cookies();
  jar.delete(EPK_COOKIE);
  return { ok: true };
}
