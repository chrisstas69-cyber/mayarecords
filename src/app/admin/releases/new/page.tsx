import { createClient } from "@/lib/supabase/server";
import { ReleaseWizard } from "@/components/admin/ReleaseWizard";

export const metadata = { title: "New Release" };

export default async function NewReleasePage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data: artists } = await supabase!.from("artists").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">New Release</h1>
        <p className="mt-2 text-sm text-stone">
          Four quick steps. Your work autosaves as a draft the moment you type a title.
        </p>
      </header>
      <ReleaseWizard artists={artists ?? []} />
    </div>
  );
}
