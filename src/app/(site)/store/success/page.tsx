import type { Metadata } from "next";
import Link from "next/link";
import { Check, Download } from "lucide-react";
import { fulfillCheckoutSession } from "@/lib/commerce/fulfill";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Complete", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StoreSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <Shell>
        <h1 className="display-lg text-cream">Missing order reference</h1>
        <p className="mt-4 text-sand">We couldn&apos;t find an order to show. If you just paid, check your email receipt.</p>
        <BackToStore />
      </Shell>
    );
  }

  const { order, error } = await fulfillCheckoutSession(session_id);

  if (error || !order) {
    return (
      <Shell>
        <h1 className="display-lg text-cream">Something went sideways</h1>
        <p className="mt-4 max-w-md text-sand">{error}</p>
        <BackToStore />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok text-ok">
        <Check size={28} />
      </div>
      <h1 className="display-lg text-cream">Thank you.</h1>
      <p className="mt-4 text-sand">
        Order confirmed{order.email ? ` — a receipt is on its way to ${order.email}` : ""}.
      </p>

      {order.downloads.length > 0 && (
        <div className="mx-auto mt-10 max-w-md border border-line bg-surface p-6 text-left">
          <p className="meta mb-4">Your downloads · MP3 + WAV</p>
          <ul className="space-y-3">
            {order.downloads.map((d) => (
              <li key={d.token}>
                <a
                  href={`/api/download/${d.token}`}
                  className="flex items-center justify-between gap-3 border border-gold/50 px-4 py-3.5 text-sm text-gold transition-all hover:bg-gold hover:text-night"
                >
                  <span className="truncate">{d.title}</span>
                  <Download size={15} className="shrink-0" />
                </a>
                <p className="mt-1 text-[0.65rem] text-faint">Link valid until {formatDate(d.expiresAt)} · 5 downloads</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.merchItems.length > 0 && (
        <div className="mx-auto mt-6 max-w-md border border-line bg-surface p-6 text-left">
          <p className="meta mb-4">Shipping to you</p>
          <ul className="space-y-2">
            {order.merchItems.map((m, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-cream">
                  {m.title}
                  {m.variant ? ` · ${m.variant}` : ""}
                </span>
                <span className="text-stone">× {m.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BackToStore />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-36 text-center sm:px-8 md:pt-44">{children}</div>
  );
}

function BackToStore() {
  return (
    <div className="mt-10 flex justify-center gap-4">
      <Link
        href="/store"
        className="border border-cream/25 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-cream transition-colors hover:border-cream/60"
      >
        Back to the Store
      </Link>
      <Link
        href="/releases"
        className="border border-gold/50 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
      >
        Browse Releases
      </Link>
    </div>
  );
}
