import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CatalogLanding } from "@/components/site/CatalogLanding";
import { getPublishedReleases, getSiteSettings } from "@/lib/data/catalog";
import { JOESKI_BIO_SHORT } from "@/lib/data/seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [releases, settings] = await Promise.all([
    getPublishedReleases(),
    getSiteSettings(),
  ]);
  return (
    <>
      <CatalogLanding releases={releases} promotion={settings.promotion} />
      <section
        className="border-y border-line bg-night-2"
        aria-label="Explore Joeski"
      >
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10">
          {[
            {
              href: "/remixes",
              title: "Joeski Remixes",
              text: "Beyond Maya. Explore Joeski’s remixes for other labels, with artwork and direct store links.",
            },
            {
              href: "/members",
              title: "Members Vault",
              text: "Joeski edits, DJ tools and the members community — a different side of the studio.",
            },
            {
              href: "/mixes",
              title: "DJ Mixes & Radio",
              text: "Long-form journeys, late-night selections and the sound behind the records.",
            },
          ].map((item) => (
            <div key={item.href}>
              <h2 className="font-display text-2xl text-cream">{item.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-sand">
                {item.text}
              </p>
              <Link href={item.href} className="catalog-action mt-5 text-gold">
                Explore <ArrowUpRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <section
        className="mx-auto grid max-w-[1600px] items-center gap-8 px-5 py-14 sm:px-8 md:grid-cols-2 lg:px-10"
        aria-label="About Joeski"
      >
        <div>
          <p className="eyebrow mb-4">The story</p>
          <h2 className="display-md text-cream">
            Change is inevitable.
            <br />
            <span className="text-gold">The groove is not.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-sand">
            {JOESKI_BIO_SHORT}
          </p>
          <Link href="/about" className="catalog-action mt-6 text-gold">
            About Joeski <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden border border-line">
          <Image
            src="/images/live/hero-crowd-2.jpg"
            alt="Joeski projected above a packed dancefloor"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>
    </>
  );
}
