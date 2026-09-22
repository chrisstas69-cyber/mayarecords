import type { Metadata } from "next";
import Image from "next/image";
import { Check, Disc3, Download, Drum, Layers, Lock, Package, Radio, Sparkles } from "lucide-react";
import { PreviewButton } from "@/components/site/AudioPlayer";
import { Reveal } from "@/components/site/Reveal";
import { EmailCapture, JoinForm, SignOutButton } from "@/components/members/MemberForms";
import {
  getMemberAccess,
  getReleasedEdits,
  getUpcomingEdits,
  isStripeMembershipConfigured,
  type Edit,
} from "@/lib/members";
import { formatDate, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Members",
  description: "Joeski Members — his dancefloor tools for DJs. A new Joeski edit every week, plus the full edit vault.",
};

const VAULT = [
  { icon: Disc3, title: "Weekly Edits", body: "A new Joeski edit every Friday, built and road-tested for the floor. Every past edit stays unlocked.", live: true },
  { icon: Package, title: "Sample Packs", body: "Percussion loops, vocal chops and textures pulled from Joeski's own sessions.", live: false },
  { icon: Drum, title: "Drum Kits", body: "The tribal and tech house drums behind three decades of Maya records — one-shots and loops.", live: false },
  { icon: Layers, title: "Stems", body: "Multitrack stems from Maya originals — remix them, rework them, play them your way.", live: false },
  { icon: Radio, title: "Live Sets", body: "Full-length recordings and live streams, only on this platform.", live: false },
  { icon: Sparkles, title: "Early Releases", body: "Hear new Maya Records releases before they hit Beatport and Traxsource.", live: false },
];

const TIERS = [
  {
    name: "Members",
    price: "$10",
    active: true,
    perks: ["New Joeski edit every week", "Full edit vault, WAV + MP3", "Members-only mailing list"],
  },
  {
    name: "Producer",
    price: "TBA",
    active: false,
    perks: ["Everything in Members", "Sample packs & drum kits", "Monthly stems"],
  },
  {
    name: "Inner Circle",
    price: "TBA",
    active: false,
    perks: ["Everything in Producer", "Live sets & streams", "Early Maya releases"],
  },
];

function EditCard({ edit, member }: { edit: Edit; member: boolean }) {
  const subtitle = `Joeski vs ${edit.original_artist}`;
  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden border border-line bg-surface">
        <Image src={edit.cover_url} alt={`${edit.title} edit artwork`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        <div className="absolute bottom-3 right-3">
          <PreviewButton
            url={member ? `/api/members/edits/${edit.slug}?inline=1` : edit.preview_url}
            title={`${edit.title} (Joeski Edit)`}
            subtitle={subtitle}
            coverUrl={edit.cover_url}
          />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-sm text-cream">{edit.title}</p>
        <p className="text-xs text-sand">{subtitle}</p>
        <p className="mt-1 text-xs text-faint">
          {formatDate(edit.drop_date)} · {formatDuration(edit.duration_seconds)}
        </p>
        {member ? (
          <div className="mt-2 flex gap-4 text-[0.65rem] uppercase tracking-[0.2em]">
            <a href={`/api/members/edits/${edit.slug}?format=wav`} className="flex items-center gap-1 text-gold hover:text-gold-bright">
              <Download size={12} /> WAV
            </a>
            <a href={`/api/members/edits/${edit.slug}?format=mp3`} className="flex items-center gap-1 text-gold hover:text-gold-bright">
              <Download size={12} /> MP3
            </a>
          </div>
        ) : (
          <p className="mt-2 flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.2em] text-stone">
            <Lock size={11} /> Members download
          </p>
        )}
      </div>
    </div>
  );
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const [{ welcome }, access] = await Promise.all([searchParams, getMemberAccess()]);
  const released = getReleasedEdits();
  const upcoming = getUpcomingEdits();
  const [latest, ...older] = released;
  const member = access.member;
  const showDemo = !isStripeMembershipConfigured();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-16 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div>
          <p className="eyebrow mb-3">Joeski Members</p>
          <h1 className="display-lg text-cream">Tools for the dancefloor.</h1>
          <p className="mt-5 max-w-xl leading-relaxed text-sand">
            The edits Joeski plays in his own sets — one new edit every week, plus everything he has made before. For DJs,
            by a DJ. {released.length} edits in the vault, {upcoming.length} on the way.
          </p>
        </div>
        <div className="border border-line bg-surface p-6 sm:p-8">
          {member ? (
            <>
              <p className="eyebrow mb-2">{access.via === "demo" ? "Demo member view" : "You're a member"}</p>
              <p className="text-sm text-sand">
                {welcome ? "Welcome in. " : ""}Every released edit is unlocked below — stream it, or grab the WAV.
              </p>
              <div className="mt-5">
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <p className="flex items-baseline gap-2">
                <span className="display-md text-cream">$10</span>
                <span className="text-sm text-stone">/ month · cancel anytime</span>
              </p>
              <p className="mb-5 mt-2 text-sm text-sand">A new Joeski edit every Friday + the full vault.</p>
              <JoinForm showDemo={showDemo} />
            </>
          )}
        </div>
      </header>

      {latest && (
        <Reveal className="mb-20 grid items-center gap-10 border border-line bg-surface p-6 sm:p-10 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden border border-line">
            <Image src={latest.cover_url} alt={`${latest.title} edit artwork`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <p className="eyebrow mb-3">This week&apos;s edit</p>
            <h2 className="display-md text-cream">{latest.title}</h2>
            <p className="mt-2 text-sand">Joeski vs {latest.original_artist} · Joeski Edit</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="meta">Dropped</p>
                <p className="mt-1 text-sm text-cream">{formatDate(latest.drop_date)}</p>
              </div>
              <div>
                <p className="meta">Length</p>
                <p className="mt-1 text-sm text-cream">{formatDuration(latest.duration_seconds)}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <PreviewButton
                url={member ? `/api/members/edits/${latest.slug}?inline=1` : latest.preview_url}
                title={`${latest.title} (Joeski Edit)`}
                subtitle={`Joeski vs ${latest.original_artist}`}
                coverUrl={latest.cover_url}
                size={52}
              />
              {member ? (
                <a
                  href={`/api/members/edits/${latest.slug}?format=wav`}
                  className="flex items-center gap-2 bg-gold px-7 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-night hover:bg-gold-bright"
                >
                  <Download size={14} /> Download WAV
                </a>
              ) : (
                <p className="text-sm text-stone">60-second preview · members get the full edit</p>
              )}
            </div>
          </div>
        </Reveal>
      )}

      <section className="mb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="display-sm text-cream">The Edit Vault</h2>
          <p className="meta">{released.length} edits</p>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {older.map((e) => (
            <EditCard key={e.slug} edit={e} member={member} />
          ))}
          {upcoming.map((e) => (
            <div key={e.slug}>
              <div className="relative flex aspect-square items-center justify-center border border-dashed border-line-strong bg-night-2">
                <div className="text-center">
                  <Lock className="mx-auto text-stone" size={22} />
                  <p className="meta mt-3">Drops</p>
                  <p className="mt-1 text-sm text-sand">{formatDate(e.drop_date)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-faint">Next Joeski edit</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <h2 className="display-sm mb-2 text-cream">What members get</h2>
        <p className="mb-10 max-w-xl text-sand">Edits are live now. The rest of Joeski&apos;s toolkit rolls out to members next.</p>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {VAULT.map(({ icon: Icon, title, body, live }) => (
            <div key={title} className="bg-night p-7">
              <div className="flex items-center justify-between">
                <Icon size={22} className="text-gold" />
                <span className={`text-[0.6rem] uppercase tracking-[0.25em] ${live ? "text-ok" : "text-stone"}`}>
                  {live ? "Live now" : "Coming soon"}
                </span>
              </div>
              <h3 className="mt-5 text-lg text-cream">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sand">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <h2 className="display-sm mb-10 text-cream">Membership</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className={`border p-7 ${t.active ? "border-gold bg-surface" : "border-line opacity-70"}`}>
              <p className="eyebrow">{t.name}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="display-md text-cream">{t.price}</span>
                {t.active && <span className="text-sm text-stone">/ month</span>}
              </p>
              <ul className="mt-6 space-y-3">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-sand">
                    <Check size={15} className="mt-0.5 shrink-0 text-gold" /> {p}
                  </li>
                ))}
              </ul>
              {!t.active && <p className="meta mt-6">Coming soon</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line pt-14">
        <h2 className="display-sm text-cream">Not ready to join?</h2>
        <p className="mb-6 mt-2 max-w-xl text-sand">Get the drop alerts, live-set announcements and label news.</p>
        <EmailCapture />
      </section>
    </div>
  );
}
