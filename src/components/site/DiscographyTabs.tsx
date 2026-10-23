import Link from "next/link";

export function DiscographyTabs({ active }: { active: "releases" | "remixes" }) {
  return (
    <nav aria-label="Discography" className="mb-10 flex flex-wrap gap-3">
      {[
        { key: "releases", href: "/releases", label: "Maya Records" },
        { key: "remixes", href: "/remixes", label: "Joeski Remixes" },
      ].map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={`border px-5 py-3 text-xs uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
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
