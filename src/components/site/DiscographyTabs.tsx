import Link from "next/link";

export function DiscographyTabs({
  active,
  compact = false,
}: {
  active: "releases" | "remixes" | "micasa" | "big-chief";
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="Discography"
      className={`${compact ? "mt-4" : "mb-10"} flex flex-wrap gap-3`}
    >
      {[
        { key: "releases", href: "/releases", label: "Maya Records" },
        { key: "remixes", href: "/remixes", label: "Joeski Remixes" },
        { key: "micasa", href: "/labels/micasa", label: "Micasa · Vinyl archive" },
        { key: "big-chief", href: "/labels/big-chief", label: "Big Chief · Vinyl archive" },
      ].map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={`border ${compact ? "px-4 py-2.5 text-[0.65rem]" : "px-5 py-3 text-xs"} uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
            active === item.key
              ? "border-gold bg-gold text-night"
              : "border-line text-sand hover:border-gold hover:text-gold"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
