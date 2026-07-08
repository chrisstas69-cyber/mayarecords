import Link from "next/link";
import { PlusCircle, UploadCloud, Disc3, FileClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StateBadge } from "@/components/admin/ui";
import type { PublishState } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen

  const [{ count: published }, { count: drafts }, { count: scheduled }, { count: artists }, { data: recent }, { data: activity }] =
    await Promise.all([
      supabase!.from("releases").select("id", { count: "exact", head: true }).eq("state", "published"),
      supabase!.from("releases").select("id", { count: "exact", head: true }).eq("state", "draft"),
      supabase!.from("releases").select("id", { count: "exact", head: true }).eq("state", "scheduled"),
      supabase!.from("artists").select("id", { count: "exact", head: true }),
      supabase!
        .from("releases")
        .select("id, title, catalog_number, state, updated_at, artists(name)")
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase!.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8),
    ]);

  const stats = [
    { label: "Published", value: published ?? 0 },
    { label: "Drafts", value: drafts ?? 0 },
    { label: "Scheduled", value: scheduled ?? 0 },
    { label: "Artists", value: artists ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Dashboard</h1>
        <p className="mt-2 text-sm text-stone">The label at a glance.</p>
      </header>

      {/* Primary actions — biggest targets first, phone-first */}
      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/releases/new"
          className="flex items-center gap-4 border border-gold/50 bg-surface px-6 py-6 transition-all hover:bg-gold hover:text-night group"
        >
          <PlusCircle size={26} className="text-gold group-hover:text-night" strokeWidth={1.6} />
          <div>
            <p className="text-base font-medium text-cream group-hover:text-night">Add New Release</p>
            <p className="text-xs text-stone group-hover:text-night/70">Step-by-step, works great on a phone</p>
          </div>
        </Link>
        <Link
          href="/admin/bulk"
          className="flex items-center gap-4 border border-line bg-surface px-6 py-6 transition-all hover:border-gold group"
        >
          <UploadCloud size={26} className="text-sand group-hover:text-gold" strokeWidth={1.6} />
          <div>
            <p className="text-base font-medium text-cream">Bulk Upload Catalog</p>
            <p className="text-xs text-stone">CSV import for the back catalog — desktop recommended</p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line bg-surface px-5 py-5">
            <p className="display-md text-gold">{s.value}</p>
            <p className="meta mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recently touched */}
        <section aria-label="Recently updated releases">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-sand">
              <Disc3 size={15} /> Recent Releases
            </h2>
            <Link href="/admin/releases" className="text-xs text-stone hover:text-gold">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-line border border-line bg-surface">
            {(recent ?? []).map((r) => (
              <Link
                key={r.id}
                href={`/admin/releases/${r.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{r.title}</p>
                  <p className="text-xs text-stone">
                    {(r.artists as unknown as { name: string } | null)?.name} · {r.catalog_number}
                  </p>
                </div>
                <StateBadge state={r.state as PublishState} />
              </Link>
            ))}
            {(recent ?? []).length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-stone">
                No releases yet — add your first one or run the seed.
              </p>
            )}
          </div>
        </section>

        {/* Activity */}
        <section aria-label="Recent activity">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-sand">
            <FileClock size={15} /> Activity
          </h2>
          <div className="divide-y divide-line border border-line bg-surface">
            {(activity ?? []).map((a) => (
              <div key={a.id} className="px-4 py-3.5">
                <p className="text-sm text-cream">{a.detail ?? a.action}</p>
                <p className="mt-0.5 text-xs text-stone">
                  {a.actor_email ?? "system"} ·{" "}
                  {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            ))}
            {(activity ?? []).length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-stone">Actions will show up here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
