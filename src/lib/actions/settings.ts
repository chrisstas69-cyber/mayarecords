"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./releases";
import { validatePromotion } from "@/lib/promotion";
import type { PromotionConfig } from "@/lib/promotion";

export async function updateSiteSettings(input: {
  hero_headline: string;
  hero_subline: string;
  hero_media_url: string;
  booking_email: string;
  demo_email: string;
  promotion: PromotionConfig;
}): Promise<ActionResult> {
  const promotion = validatePromotion(input.promotion);
  if (!promotion.value) return { ok: false, error: promotion.error };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return { ok: false, error: "Only admins can change site settings." };

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      hero_headline: input.hero_headline.trim() || null,
      hero_subline: input.hero_subline.trim() || null,
      hero_media_url: input.hero_media_url.trim() || null,
      booking_email: input.booking_email.trim() || null,
      demo_email: input.demo_email.trim() || null,
      promotion: promotion.value,
    })
    .eq("id", 1)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.message.includes("row-level security"))
      return { ok: false, error: "Only admins can change site settings." };
    return { ok: false, error: error.message };
  }
  if (!data)
    return {
      ok: false,
      error:
        "Settings were not saved. Check admin permissions and the site settings row.",
    };
  revalidatePath("/", "layout");
  revalidatePath("/releases");
  return { ok: true };
}
