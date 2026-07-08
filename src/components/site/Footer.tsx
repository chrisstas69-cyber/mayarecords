import Link from "next/link";
import Image from "next/image";
import { BOOKING } from "@/lib/data/seed";

const PLATFORM_LINKS = [
  { label: "SoundCloud", url: "https://soundcloud.com/mayarecordings" },
  { label: "Beatport", url: "https://www.beatport.com/label/maya-records/1035" },
  { label: "Traxsource", url: "https://www.traxsource.com/label/447/maya-records" },
  { label: "Resident Advisor", url: "https://ra.co/dj/joeski" },
  { label: "Instagram", url: "https://instagram.com/djjoeski" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-night-2">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-3">
        <div>
          <Image
            src="/images/logos/maya-white.png"
            alt="Maya Records"
            width={140}
            height={60}
            className="h-12 w-auto opacity-90"
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-stone">
            Independent since 2001. Tribal, deep and tech house from New York — released on its own terms.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Listen</h3>
          <ul className="space-y-3">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sand transition-colors hover:text-gold"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Bookings & Label</h3>
          <ul className="space-y-3 text-sm text-sand">
            <li>
              Worldwide bookings via{" "}
              <a href={BOOKING.agencyUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright">
                {BOOKING.agency}
              </a>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-gold">
                Contact & demo policy
              </Link>
            </li>
            <li>
              <Link href="/press" className="transition-colors hover:text-gold">
                Press kit & photos
              </Link>
            </li>
            <li>
              <Link href="/store" className="transition-colors hover:text-gold">
                Store — merch & downloads
              </Link>
            </li>
            <li>
              <Link href="/mixes" className="transition-colors hover:text-gold">
                DJ mixes & radio
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-[0.65rem] uppercase tracking-[0.25em] text-faint sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} Joeski · Maya Records · New York</span>
          <Link href="/admin" className="transition-colors hover:text-stone">
            Label Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
