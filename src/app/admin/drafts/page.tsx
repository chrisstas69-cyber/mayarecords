import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { StateBadge } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import type { PublishState } from "@/lib/types";

export const metadata = { title: "Drafts & Pending" };

export default async function DraftsPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const [{ data: drafts }, { data: jobs }] = await Promise.all([
    supabase!
      .from("releases")
      .select("id, title, catalog_number, cover_url, state, updated_at, release_date, artists(name)")
      .in("state", ["draft", "scheduled"])
      .order("updated_at", { ascending: false }),
    supabase!
      .from("import_jobs")
      .select("*")
      .in("status", ["mapping", "validating", "review"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Drafts & Pending</h1>
        <p className="mt-2 text-sm text-stone">Work in progress — finish it, schedule it, or publish it.</p>
      </header>

      {(jobs ?? []).length > 0 && (
        <section className="mb-10" aria-label="Unfinished imports">
          <h2 className="meta mb-4">Unfinished bulk imports</h2>
          <div className="divide-y divide-line border border-line bg-surface">
            {jobs!.map((job) => (
              <Link
                key={job.id}
                href={`/admin/bulk?job=${job.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
              >
                <div>
                  <p className="text-sm text-cream">{job.filename}</p>
                  <p className="text-xs text-stone">
                    {job.row_count} rows · started {formatDate(job.created_at)}
                  </p>
                </div>
                <span className="border border-gold/60 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-gold">
                  {job.status} — resume
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Draft releases">
        <h2 className="meta mb-4">Draft releases</h2>
        {(drafts ?? []).length === 0 ? (
          <div className="border border-line bg-surface px-6 py-16 text-center">
            <p className="display-sm text-stone">Clean desk.</p>
            <p className="mt-2 text-sm text-faint">No drafts waiting. Start a new release and it will autosave here.</p>
            <Link href="/admin/releases/new" className="mt-6 inline-block border border-gold/50 px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-night">
              Add New Release
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts!.map((d) => (
              <Link key={d.id} href={`/admin/releases/${d.id}`} className="flex items-center gap-4 border border-line bg-surface p-4 transition-colors hover:border-gold/50">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-night">
                  {d.cover_url && <Image src={d.cover_url} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-cream">{d.title}</p>
                  <p className="text-xs text-stone">
                    {(d.artists as unknown as { name: string } | null)?.name ?? "No artist"} · {d.catalog_number} · updated{" "}
                    {formatDate(d.updated_at)}
                  </p>
                </div>
                <StateBadge state={d.state as PublishState} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
