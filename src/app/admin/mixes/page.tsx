import { createClient } from "@/lib/supabase/server";
import { MixManager } from "@/components/admin/MixManager";
import type { Mix } from "@/lib/types";

export const metadata = { title: "Mixes" };

export default async function AdminMixesPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data } = await supabase
    .from("mixes")
    .select("*")
    .order("recorded_on", { ascending: false, nullsFirst: false });

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Mixes</h1>
        <p className="mt-2 text-sm text-stone">
          Radio sessions and live recordings. Upload the audio and it streams right on the site.
        </p>
      </header>
      <MixManager mixes={(data ?? []) as Mix[]} />
    </div>
  );
}
