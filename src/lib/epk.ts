import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Promoter-only Electronic Press Kit.
 * Promoters register once (the label keeps their details), then a signed
 * cookie unlocks /press and the gated downloads on that device.
 */

export const EPK_COOKIE = "epk_access";
const LOCAL_FILE = path.join(process.cwd(), "private-media", "promoters.jsonl");

export interface PromoterInput {
  name: string;
  email: string;
  company: string;
  role: string;
  city: string;
  country: string;
  phone?: string;
  website?: string;
  instagram?: string;
  event_details?: string;
}

function secret(): string {
  return process.env.EPK_SECRET || "dev-only-epk-secret-change-me";
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("hex");
}

export function makeAccessToken(email: string): string {
  return `${Buffer.from(email).toString("base64url")}.${sign(email)}`;
}

export function readAccessToken(token: string | undefined): string | null {
  if (!token) return null;
  const [encoded, mac] = token.split(".");
  if (!encoded || !mac) return null;
  const email = Buffer.from(encoded, "base64url").toString();
  const expected = sign(email);
  if (mac.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? email : null;
}

export async function getPromoterEmail(): Promise<string | null> {
  const jar = await cookies();
  return readAccessToken(jar.get(EPK_COOKIE)?.value);
}

export async function savePromoter(p: PromoterInput): Promise<boolean> {
  if (isSupabaseConfigured()) {
    // Service role: re-registering refreshes a row, which the public must not be able to do directly.
    const supabase = createServiceClient();
    if (!supabase) return false;
    const { error } = await supabase.from("promoters").upsert(
      { ...p, last_access_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    return !error;
  }
  try {
    await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await appendFile(LOCAL_FILE, JSON.stringify({ ...p, at: new Date().toISOString() }) + "\n");
    return true;
  } catch {
    return false;
  }
}

export async function promoterExists(email: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = createServiceClient();
    if (!supabase) return false;
    const { data } = await supabase.rpc("promoter_exists", { p_email: email });
    return Boolean(data);
  }
  try {
    const lines = (await readFile(LOCAL_FILE, "utf8")).split("\n").filter(Boolean);
    return lines.some((l) => (JSON.parse(l) as PromoterInput).email === email);
  } catch {
    return false;
  }
}
