"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Disc3,
  Users,
  ImageIcon,
  UploadCloud,
  FileClock,
  Settings,
  LogOut,
  Radio,
  ShoppingBag,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/releases/new", label: "New Release", icon: PlusCircle },
  { href: "/admin/releases", label: "Releases", icon: Disc3, exact: true },
  { href: "/admin/mixes", label: "Mixes", icon: Radio },
  { href: "/admin/merch", label: "Merch", icon: ShoppingBag },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/audience", label: "Promoters & Fans", icon: Contact },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/bulk", label: "Bulk Upload", icon: UploadCloud },
  { href: "/admin/drafts", label: "Drafts", icon: FileClock },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

/** Mobile-priority items for the bottom tab bar. */
const MOBILE_HREFS = ["/admin", "/admin/releases/new", "/admin/releases", "/admin/drafts", "/admin/settings"];
const MOBILE_NAV = MOBILE_HREFS.map((href) => NAV.find((n) => n.href === href)!);

export function AdminNav({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-night-2 lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-6 py-5">
          <Image src="/images/logos/maya-white.png" alt="Maya Records" width={90} height={38} className="h-8 w-auto" />
          <span className="text-[0.58rem] uppercase tracking-[0.3em] text-stone">Portal</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mb-1 flex items-center gap-3 px-3 py-2.5 text-[0.82rem] transition-colors",
                  isActive(item) ? "bg-surface text-gold" : "text-sand hover:bg-surface hover:text-cream"
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-6 py-4">
          <p className="mb-2 truncate text-xs text-stone">{email}</p>
          <button onClick={onSignOut} className="flex items-center gap-2 text-xs text-sand transition-colors hover:text-error">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-night-2/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/images/logos/maya-white.png" alt="Maya Records" width={70} height={30} className="h-6 w-auto" />
          <span className="text-[0.55rem] uppercase tracking-[0.3em] text-stone">Portal</span>
        </Link>
        <button onClick={onSignOut} aria-label="Sign out" className="p-2 text-sand">
          <LogOut size={16} />
        </button>
      </header>

      {/* Mobile bottom tab bar — thumb-reach for the core flows */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-night-2/95 backdrop-blur lg:hidden"
        aria-label="Admin quick navigation"
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[0.55rem] uppercase tracking-wider",
                active ? "text-gold" : "text-stone"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2 : 1.6} />
              {item.label.replace("New Release", "New").replace("Media Library", "Media")}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
