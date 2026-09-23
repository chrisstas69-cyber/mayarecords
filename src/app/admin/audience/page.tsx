import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promoters & Fans" };

interface PromoterRow {
  email: string;
  name: string;
  company: string;
  role: string;
  city: string;
  country: string;
  phone: string | null;
  instagram: string | null;
  event_details: string | null;
  created_at: string;
}

interface FanRow {
  email: string;
  source: string | null;
  created_at: string;
}

export default async function AudiencePage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen

  const [{ data: promoters }, { data: fans }, { count: members }] = await Promise.all([
    supabase.from("promoters").select("*").order("created_at", { ascending: false }),
    supabase.from("fans").select("email, source, created_at").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
  ]);
  const p = (promoters ?? []) as PromoterRow[];
  const f = (fans ?? []) as FanRow[];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-md text-cream">Promoters & Fans</h1>
          <p className="mt-2 text-sm text-stone">Everyone who unlocked the press kit or joined the mailing list.</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/audience/export?list=promoters" className="border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand hover:border-gold hover:text-gold">
            Export promoters CSV
          </a>
          <a href="/admin/audience/export?list=fans" className="border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand hover:border-gold hover:text-gold">
            Export fans CSV
          </a>
        </div>
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Promoters", p.length],
          ["Fan emails", f.length],
          ["Paying members", members ?? 0],
        ].map(([label, n]) => (
          <div key={label} className="border border-line bg-surface p-5">
            <p className="meta">{label}</p>
            <p className="display-sm mt-2 text-cream">{n}</p>
          </div>
        ))}
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-lg text-cream">Promoters</h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              <tr>
                {["Name", "Company", "Role", "Location", "Contact", "Booking note", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.map((r) => (
                <tr key={r.email} className="border-t border-line align-top text-sand">
                  <td className="px-4 py-3 text-cream">{r.name}</td>
                  <td className="px-4 py-3">{r.company}</td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3">{r.city}, {r.country}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email}`} className="text-gold">{r.email}</a>
                    {r.phone && <div className="text-xs">{r.phone}</div>}
                    {r.instagram && <div className="text-xs">{r.instagram}</div>}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs">{r.event_details ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(r.created_at)}</td>
                </tr>
              ))}
              {p.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-stone">No promoters yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg text-cream">Fan mailing list</h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              <tr>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Source</th>
                <th className="px-4 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {f.map((r) => (
                <tr key={r.email} className="border-t border-line text-sand">
                  <td className="px-4 py-3 text-cream">{r.email}</td>
                  <td className="px-4 py-3">{r.source ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(r.created_at)}</td>
                </tr>
              ))}
              {f.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-stone">No fans yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
