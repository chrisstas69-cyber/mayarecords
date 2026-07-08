import { createClient } from "@/lib/supabase/server";
import { MerchManager } from "@/components/admin/MerchManager";
import type { Product } from "@/lib/types";

export const metadata = { title: "Merch" };

export default async function AdminMerchPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data } = await supabase.from("products").select("*").order("sort");

  const products = (data ?? []).map((p) => ({ ...(p as unknown as Product), sizes: (p.sizes as string[]) ?? [] }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Merch</h1>
        <p className="mt-2 text-sm text-stone">
          The store&apos;s physical goods. Digital release pricing lives on each release&apos;s edit page.
        </p>
      </header>
      <MerchManager products={products} />
    </div>
  );
}
