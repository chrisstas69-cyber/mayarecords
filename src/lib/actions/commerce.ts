"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "./releases";
import type { PublishState } from "@/lib/types";

async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Not signed in." };
  return { supabase, user, error: null };
}

export interface MixInput {
  title: string;
  recorded_on?: string;
  duration_minutes?: string;
  description?: string;
  cover_url?: string | null;
  audio_url?: string | null;
  external_url?: string;
  tracklist?: string;
  state?: PublishState;
  featured?: boolean;
}

export async function saveMix(mixId: string | null, input: MixInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error) return { ok: false, error };
  if (!input.title?.trim()) return { ok: false, error: "A mix title is required." };

  const minutes = input.duration_minutes ? Number(input.duration_minutes) : NaN;
  const payload = {
    title: input.title.trim(),
    recorded_on: input.recorded_on || null,
    duration_seconds: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
    description: input.description?.trim() || null,
    cover_url: input.cover_url || null,
    audio_url: input.audio_url || null,
    external_url: input.external_url?.trim() || null,
    tracklist: input.tracklist?.trim() || null,
    state: input.state ?? "draft",
    featured: input.featured ?? false,
  };

  if (mixId) {
    const { error: dbError } = await supabase!.from("mixes").update(payload).eq("id", mixId);
    if (dbError) return { ok: false, error: dbError.message };
    revalidatePath("/", "layout");
    return { ok: true, data: { id: mixId } };
  }

  const { data, error: dbError } = await supabase!
    .from("mixes")
    .insert({ ...payload, slug: slugify(payload.title), created_by: user!.id })
    .select("id")
    .single();
  if (dbError) return { ok: false, error: dbError.message.includes("mixes_slug_key") ? "A mix with that title already exists." : dbError.message };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function deleteMix(mixId: string): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const { error: dbError } = await supabase!.from("mixes").delete().eq("id", mixId);
  if (dbError) return { ok: false, error: dbError.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface ProductInput {
  name: string;
  category?: string;
  description?: string;
  price: string; // dollars, e.g. "38" or "38.50"
  image_url?: string | null;
  sizes_raw?: string; // comma-separated
  active?: boolean;
}

export async function saveProduct(productId: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  if (!input.name?.trim()) return { ok: false, error: "A product name is required." };
  const dollars = Number(input.price);
  if (!Number.isFinite(dollars) || dollars < 0) return { ok: false, error: "Enter a valid price (e.g. 38 or 38.50)." };

  const payload = {
    name: input.name.trim(),
    category: input.category?.trim() || "apparel",
    description: input.description?.trim() || null,
    price_cents: Math.round(dollars * 100),
    image_url: input.image_url || null,
    sizes: (input.sizes_raw ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    active: input.active ?? true,
  };

  if (productId) {
    const { error: dbError } = await supabase!.from("products").update(payload).eq("id", productId);
    if (dbError) return { ok: false, error: friendly(dbError.message) };
    revalidatePath("/store");
    return { ok: true, data: { id: productId } };
  }
  const { data, error: dbError } = await supabase!
    .from("products")
    .insert({ ...payload, slug: slugify(payload.name) })
    .select("id")
    .single();
  if (dbError) return { ok: false, error: friendly(dbError.message) };
  revalidatePath("/store");
  return { ok: true, data: { id: data.id } };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const { error: dbError } = await supabase!.from("products").delete().eq("id", productId);
  if (dbError) return { ok: false, error: dbError.message };
  revalidatePath("/store");
  return { ok: true };
}

function friendly(message: string): string {
  if (message.includes("products_slug_key")) return "A product with that name already exists.";
  if (message.includes("row-level security")) return "Only admins can manage merch.";
  return message;
}
