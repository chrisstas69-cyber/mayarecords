import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const [{ data: settings }, { data: profiles }] = await Promise.all([
    supabase!.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase!.from("profiles").select("email, role, created_at").order("created_at"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Settings</h1>
        <p className="mt-2 text-sm text-stone">Site copy, hero media and contact addresses.</p>
      </header>

      <SettingsForm
        initial={{
          hero_headline: settings?.hero_headline ?? "Music for the floor.",
          hero_subline: settings?.hero_subline ?? "DJ. Producer. Maya Records. Built from New York, played worldwide.",
          hero_media_url: settings?.hero_media_url ?? "",
          booking_email: settings?.booking_email ?? "",
          demo_email: settings?.demo_email ?? "",
        }}
      />

      {(profiles ?? []).length > 0 && (
        <section className="mt-12" aria-label="Team">
          <h2 className="meta mb-4">Team access</h2>
          <div className="divide-y divide-line border border-line bg-surface">
            {profiles!.map((p) => (
              <div key={p.email} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-cream">{p.email}</span>
                <span className="text-[0.62rem] uppercase tracking-[0.18em] text-gold">{p.role}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone">
            Roles are managed in Supabase for now: <code className="text-gold">update profiles set role = &apos;admin&apos; where email = …</code>
          </p>
        </section>
      )}
    </div>
  );
}
