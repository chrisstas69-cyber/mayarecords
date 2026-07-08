import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { BOOKING } from "@/lib/data/seed";

export const metadata: Metadata = {
  title: "Contact & Bookings",
  description: "Book Joeski worldwide via Armigé Agency. Demo submissions for Maya Records.",
};

const CHANNELS = [
  {
    title: "Bookings",
    body: `Worldwide bookings are handled exclusively by ${BOOKING.agency}.`,
    action: { label: "armige.com", href: BOOKING.agencyUrl },
    detail: BOOKING.email,
  },
  {
    title: "Demos to Maya Records",
    body: "Unreleased, dancefloor-ready material only. Private SoundCloud links preferred — no attachments over 20MB.",
    action: { label: "Submit via email", href: `mailto:${BOOKING.demos}` },
    detail: BOOKING.demos,
  },
  {
    title: "Press & Remix Requests",
    body: "For interviews, features and remix inquiries, reach out through the agency and we'll route it.",
    action: { label: "Contact the agency", href: BOOKING.agencyUrl },
    detail: null,
  },
];

const SOCIALS = [
  { label: "Instagram", url: "https://instagram.com/djjoeski" },
  { label: "SoundCloud", url: "https://soundcloud.com/mayarecordings" },
  { label: "Beatport", url: "https://www.beatport.com/artist/joeski/1638" },
  { label: "Traxsource", url: "https://www.traxsource.com/label/447/maya-records" },
  { label: "Resident Advisor", url: "https://ra.co/dj/joeski" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <div className="grid gap-14 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="eyebrow mb-3">Get in touch</p>
          <h1 className="display-lg mb-12 text-cream">Contact & Bookings</h1>

          <div className="space-y-0">
            {CHANNELS.map((c) => (
              <div key={c.title} className="border-b border-line py-8 first:border-t">
                <h2 className="display-sm mb-3 text-cream">{c.title}</h2>
                <p className="mb-4 max-w-lg text-sm leading-relaxed text-sand">{c.body}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href={c.action.href}
                    target={c.action.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-gold/50 px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-night"
                  >
                    {c.action.label} <ExternalLink size={11} />
                  </a>
                  {c.detail && <span className="text-sm text-stone">{c.detail}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <p className="meta mb-5">Elsewhere</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sand transition-colors hover:text-gold"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="relative aspect-[3/4] overflow-hidden border border-line">
            <Image
              src="/images/film/film-09.jpg"
              alt="Joeski shot on film by Andreas Hofweber"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="mt-5 flex items-center gap-4 border border-line bg-surface px-5 py-4">
            <Image src="/images/logos/maya-head-line.png" alt="" width={40} height={40} className="h-10 w-10 object-contain opacity-80" />
            <p className="text-xs leading-relaxed text-stone">
              Maya Records · New York<br />Independent since 2001
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
