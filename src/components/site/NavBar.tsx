"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { CartButton } from "./Cart";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/releases", label: "Releases" },
  { href: "/members", label: "Members" },
  { href: "/mixes", label: "Mixes" },
  { href: "/artists", label: "Artists" },
  { href: "/store", label: "Store" },
  { href: "/about", label: "About" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact" },
];

export function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        scrolled || open ? "border-b border-line bg-night/90 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-3" aria-label="Joeski — home">
          {/* Real Joeski wordmark; screen blend removes its black background */}
          <Image
            src="/images/logos/joeski-logo.jpg"
            alt="Joeski"
            width={110}
            height={36}
            priority
            className="h-8 w-auto mix-blend-screen"
          />
          <span className="hidden text-[0.6rem] uppercase tracking-[0.35em] text-stone sm:block">
            Maya Records
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[0.72rem] uppercase tracking-[0.24em] transition-colors",
                pathname.startsWith(item.href) ? "text-gold" : "text-sand hover:text-cream"
              )}
            >
              {item.label}
            </Link>
          ))}
          <CartButton />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartButton />
          <button
            className="p-2 text-cream"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-night px-5 pb-8 pt-4 md:hidden">
          <div className="flex flex-col gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm uppercase tracking-[0.24em]",
                  pathname.startsWith(item.href) ? "text-gold" : "text-sand"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
