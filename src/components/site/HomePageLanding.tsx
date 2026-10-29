import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Release, Mix } from "@/lib/types";
import type { ResolvedPromotion } from "@/lib/promotion";
import type { Edit } from "@/lib/members";
import { HOME_DESTINATIONS } from "@/lib/homepage";
import { mixDuration } from "@/lib/mixes";
import { FeaturedMixPlay } from "./HomeInteractions";
function Promotion({ promotion }: { promotion: ResolvedPromotion }) {
  return (
    <aside className="home-promo" aria-label="Featured promotion">
      <Link href={promotion.href} className="home-promo__main">
        {promotion.image ? (
          <Image
            src={promotion.image}
            width={72}
            height={72}
            alt=""
            unoptimized={promotion.image.startsWith("https:")}
          />
        ) : (
          <ArrowUpRight size={32} />
        )}
        <span>
          <small>{promotion.badge}</small>
          <strong>{promotion.title}</strong>
          <em>{promotion.label} ↗</em>
        </span>
      </Link>
      {promotion.secondaryHref ? (
        <Link className="home-promo__secondary" href={promotion.secondaryHref}>
          {promotion.secondaryLabel} ↗
        </Link>
      ) : null}
    </aside>
  );
}
function FinalSectionHeading({
  index,
  eyebrow,
  title,
  action,
  href,
}: {
  index: string;
  eyebrow: string;
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="final-section-heading">
      <span>{index}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && href ? (
        <Link href={href}>
          {action} <span>↗</span>
        </Link>
      ) : null}
    </div>
  );
}

export function HomePageLanding({
  releases,
  edits,
  mix,
  promotion,
}: {
  releases: Release[];
  edits: Pick<Edit, "slug" | "title" | "original_artist">[];
  mix: Mix | null;
  promotion: ResolvedPromotion | null;
}) {
  return (
    <div className="final-home">
      <section className="final-hero" aria-labelledby="final-home-title">
        <div className="final-hero__media">
          <Image
            fill
            priority
            sizes="(max-width: 640px) 100vw, 72vw"
            src="/images/portraits/joeski-iconic.webp"
            alt="Joeski seated against a dark studio background"
          />
        </div>
        <div className="final-hero__veil" aria-hidden="true" />
        <div className="final-hero__glow" aria-hidden="true" />
        <div className="final-hero__copy">
          <p>Joeski · Artist / DJ / Producer</p>
          <h1 id="final-home-title">JOESKI</h1>
          <h2>
            New York roots.
            <br />
            Worldwide rhythm.
          </h2>
          <p className="final-hero__intro">
            House music with history, movement and soul. Enter the world of
            Joeski and Maya Records.
          </p>
          <div className="home-actions">
            <Link className="home-button home-button--primary" href="/new-releases">
              New from Maya
            </Link>
            <Link className="home-button" href="/members">
              Members’ Edits
            </Link>
            <Link className="home-mixes-link" href="/mixes">
              DJ Mixes <span>↗</span>
            </Link>
          </div>
        </div>
        {promotion ? <Promotion promotion={promotion} /> : null}
        <a className="final-hero__rail" href="#explore-joeski">
          <span>01—06</span>
          <p>Explore the world</p>
          <i />
        </a>
        <small className="final-photo-credit">
          Photograph: Andreas Hofweber
        </small>
      </section>

      <nav
        className="home-destinations"
        id="explore-joeski"
        aria-label="Explore Joeski — six destinations"
      >
        {HOME_DESTINATIONS.map((item) => (
          <Link href={item.href} key={item.number}>
            <span>{item.number}</span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <ArrowUpRight size={15} />
          </Link>
        ))}
      </nav>
      <div className="final-marquee" aria-label="Joeski disciplines">
        <span>Artist</span>
        <i />
        <span>DJ</span>
        <i />
        <span>Producer</span>
        <i />
        <span>Maya Records founder</span>
        <i />
        <span>New York</span>
      </div>

      <section className="final-section member-section" id="members-edits">
        <FinalSectionHeading
          index="01"
          eyebrow="Inside the circle"
          title="Members’ Edits"
          action="Member access"
          href="/members"
        />
        <div className="member-layout">
          <div className="member-intro">
            <p>
              Private selections, edits and tools from the Maya Records
              archive—reserved for members.
            </p>
            <Link className="final-text-link" href="/members">
              Enter members’ area <span>→</span>
            </Link>
          </div>
          <div className="member-cards">
            {edits.map((edit, index) => (
              <Link href="/members" className="member-card" key={edit.slug}>
                <div className="member-card__art">
                  <span>Members only</span>
                  <strong>0{index + 1}</strong>
                  <i />
                </div>
                <div>
                  <p>Exclusive edit</p>
                  <h3>{edit.title}</h3>
                  <span>{edit.original_artist} · Explore the vault</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="final-section home-release-section"
        id="latest-releases"
      >
        <FinalSectionHeading
          index="02"
          eyebrow="Maya Records"
          title="Latest Releases"
          action="Explore full catalog"
          href="/releases"
        />
        <div className="home-release-grid">
          {releases.map((release, index) => (
            <Link
              className="home-release"
              href={`/releases/${release.slug}`}
              key={release.slug}
            >
              <div className="home-release__art">
                <Image
                  fill
                  sizes="(max-width: 960px) 50vw, 25vw"
                  src={release.cover_url || "/images/logos/maya-white.png"}
                  alt={`${release.title} artwork`}
                  unoptimized={release.cover_url?.startsWith("https:")}
                />
                <span>0{index + 1}</span>
                <i>
                  <ArrowUpRight size={20} />
                </i>
              </div>
              <div>
                <p>{release.catalog_number}</p>
                <h3>{release.title}</h3>
                <span>{release.artist_name} · Maya Records</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="final-section mix-section" id="dj-mixes">
        <FinalSectionHeading
          index="03"
          eyebrow="In the mix"
          title="Featured DJ Mix"
          action="Browse DJ mixes"
          href="/mixes"
        />
        <div className="featured-mix">
          <Image
            fill
            sizes="90vw"
            src="/images/portraits/joeski-underground.webp"
            alt="Black-and-white portrait of Joeski"
          />
          <div className="featured-mix__overlay" />
          <div className="featured-mix__content">
            <p>Featured session</p>
            <h3>{mix?.title ?? "Explore the mix archive."}</h3>
            {mix ? (
              <>
                <p className="featured-mix__duration">
                  {mixDuration(mix.duration_seconds)} · Full-length session
                </p>
                <FeaturedMixPlay mix={mix} />
              </>
            ) : (
              <Link href="/mixes" className="home-button">
                Browse mixes
              </Link>
            )}
          </div>
          <small>Photograph: Cheyenne Bosco</small>
        </div>
      </section>

      <section className="artist-section" id="about-joeski">
        <div className="artist-section__image">
          <Image
            fill
            sizes="(max-width: 960px) 100vw, 54vw"
            src="/images/portraits/joeski-analog.webp"
            alt="Joeski in a warm interior portrait"
          />
        </div>
        <div className="artist-section__copy">
          <span>04 / The artist</span>
          <h2 className="artist-section__quote">
            Rhythm without borders.
            <br />
            Music on its own terms.
          </h2>
          <p>
            Rooted in New York and reaching dance floors worldwide, Joeski is an
            artist, DJ, producer and the founder of Maya Records—an independent
            house label established in 2001.
          </p>
          <Link className="final-text-link" href="/about">
            Read the artist story <span>→</span>
          </Link>
        </div>
      </section>

      <section className="final-section press-section" id="press-feature">
        <FinalSectionHeading
          index="05"
          eyebrow="From the archive"
          title="Press Feature"
        />
        <div className="press-feature">
          <a
            className="press-feature__cover press-feature__cover--image"
            href="/press/joeski-mixmag-80-2024.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read Joeski’s Mixmag cover feature (PDF, opens in new tab)"
          >
            <Image
              src="/press/joeski-mixmag-80-2024-cover.png"
              width={1280}
              height={1600}
              alt="Joeski on the cover of Mixmag Brazil, issue 80, 2024"
              sizes="(max-width: 640px) 80vw, 30vw"
            />
          </a>
          <div className="press-feature__copy">
            <p>Mixmag Brazil · Cover 80 · 2024</p>
            <h3>
              Joeski.
              <br />
              In his own words.
            </h3>
            <p>
              Step inside the story behind the music. Explore the full cover
              feature and interview from the Mixmag archive.
            </p>
            <a
              className="home-button home-button--primary"
              href="/press/joeski-mixmag-80-2024.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the full feature ↗
            </a>
            <a
              className="final-text-link"
              href="/press/joeski-mixmag-80-2024.pdf"
              download
            >
              Download PDF · 13 MB ↓
            </a>
            <Link className="final-text-link" href="/coverage">Explore all press →</Link>
            <small>
              Cover photograph: Andreas Hofweber · Original supplied edition, 11
              pages
            </small>
          </div>
        </div>
      </section>

      <section className="home-remixes" id="joeski-remixes">
        <span>06 / Beyond Maya</span>
        <h2>Another side of the groove.</h2>
        <p>
          Joeski’s remixes for other labels, with artwork and direct links to
          Beatport and Traxsource.
        </p>
        <Link className="home-button" href="/remixes">
          Explore Joeski Remixes ↗
        </Link>
      </section>
      <footer className="final-footer">
        <div>
          <strong>JOESKI</strong>
          <span>Maya Records · New York</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/releases">Catalog</Link>
          <Link href="/members">Members</Link>
          <Link href="/mixes">DJ Mixes</Link>
          <Link href="/remixes">Remixes</Link>
          <Link href="/artists">Artists</Link>
          <Link href="/store">Store</Link>
          <Link href="/press">Press kit</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p>Maya Records · Est. 2001</p>
      </footer>
    </div>
  );
}
