"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ShoppingBag } from "lucide-react";
import { useCart } from "./Cart";
import { cn, formatPrice, formatYear } from "@/lib/utils";
import type { Product, Release, Track } from "@/lib/types";
import { trackPrice } from "@/lib/commerce/pricing";

type PurchaseRelease = Pick<
  Release,
  | "id"
  | "title"
  | "artist_name"
  | "catalog_number"
  | "cover_url"
  | "digital_price_cents"
>;

/** The store: merch grid + digital catalog. Client-side for cart interactions. */
export function StoreFront({
  products,
  releases,
}: {
  products: Product[];
  releases: Release[];
}) {
  return (
    <div className="space-y-24">
      <section aria-label="Merchandise">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-3">Official</p>
            <h2 className="display-md text-cream">Merch</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <div className="waveline" aria-hidden />

      <section aria-label="Digital downloads">
        <div className="mb-10">
          <p className="eyebrow mb-3">Lossless & MP3</p>
          <h2 className="display-md text-cream">Digital Releases</h2>
          <p className="mt-3 max-w-xl text-sm text-sand">
            Buy a complete release or pick individual tracks. MP3 + WAV
            downloads, direct from the label.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {releases
            .filter((r) => r.digital_price_cents)
            .map((release) => (
              <DigitalCard key={release.id} release={release} />
            ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);

  return (
    <div className="group flex flex-col">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-line bg-surface p-10 transition-colors group-hover:border-gold/40">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-10 opacity-90 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="display-sm text-faint">
            {product.name.charAt(0)}
          </span>
        )}
        <span className="absolute left-3 top-3 text-[0.6rem] uppercase tracking-[0.25em] text-faint">
          {product.category}
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-cream">{product.name}</h3>
          <span className="shrink-0 text-sm text-gold">
            {formatPrice(product.price_cents, product.currency)}
          </span>
        </div>
        {product.description && (
          <p className="mt-1 text-xs leading-relaxed text-stone">
            {product.description}
          </p>
        )}
        {product.sizes.length > 0 && (
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-label={`${product.name} size`}
          >
            {product.sizes.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                className={cn(
                  "min-w-9 border px-2 py-1.5 text-xs transition-colors",
                  size === s
                    ? "border-gold text-gold"
                    : "border-line text-stone hover:text-cream",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() =>
            addItem({
              kind: "merch",
              productId: product.id,
              name: product.name,
              priceCents: product.price_cents,
              size,
              quantity: 1,
              imageUrl: product.image_url,
            })
          }
          className="mt-4 flex items-center justify-center gap-2 border border-gold/50 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-night"
        >
          <ShoppingBag size={13} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function DigitalCard({ release }: { release: Release }) {
  const { addItem } = useCart();
  return (
    <div className="group flex flex-col">
      <Link
        href={`/releases/${release.slug}`}
        className="relative block aspect-square overflow-hidden border border-line bg-surface"
      >
        {release.cover_url && (
          <Image
            src={release.cover_url}
            alt={`${release.title} cover art`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-medium text-cream">
            {release.title}
          </h3>
          <span className="shrink-0 text-sm text-gold">
            {formatPrice(release.digital_price_cents)}
          </span>
        </div>
        <p className="text-xs text-stone">
          {release.artist_name} · {release.catalog_number} ·{" "}
          {formatYear(release.release_date)}
        </p>
        <button
          onClick={() =>
            addItem({
              kind: "digital_release",
              releaseId: release.id,
              name: release.title,
              artistName: release.artist_name ?? "",
              catalogNumber: release.catalog_number,
              priceCents: release.digital_price_cents!,
              coverUrl: release.cover_url,
            })
          }
          className="mt-4 flex items-center justify-center gap-2 border border-gold/50 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-night"
        >
          <Download size={13} /> Buy full release
        </button>
        <Link
          href={`/releases/${release.slug}`}
          className="mt-3 py-1 text-center text-xs text-sand underline decoration-line underline-offset-4 hover:text-gold"
        >
          Choose individual tracks
        </Link>
      </div>
    </div>
  );
}

/** Buy block for the release detail page. */
export function BuyReleaseButton({
  release,
  compact = false,
}: {
  release: PurchaseRelease;
  compact?: boolean;
}) {
  const { addItem, items, setOpen } = useCart();
  const priceCents = release.digital_price_cents;
  const inCart = items.some(
    (item) => item.kind === "digital_release" && item.releaseId === release.id,
  );
  if (!priceCents) return null;
  return (
    <button
      type="button"
      aria-label={
        inCart
          ? `Open cart for ${release.title}`
          : `Buy full release ${release.title} for ${formatPrice(priceCents)}`
      }
      onClick={() =>
        inCart
          ? setOpen(true)
          : addItem({
              kind: "digital_release",
              releaseId: release.id,
              name: release.title,
              artistName: release.artist_name ?? "",
              catalogNumber: release.catalog_number,
              priceCents,
              coverUrl: release.cover_url,
            })
      }
      className={
        compact
          ? "catalog-action border-gold/50 text-gold hover:bg-gold hover:text-night"
          : "flex w-full items-center justify-center gap-3 bg-gold px-6 py-4 text-[0.78rem] font-medium uppercase tracking-[0.2em] text-night transition-colors hover:bg-gold-bright"
      }
    >
      <Download size={compact ? 13 : 15} aria-hidden="true" />{" "}
      {compact
        ? inCart
          ? "In cart"
          : formatPrice(priceCents)
        : `${inCart ? "Full release in cart" : "Buy full release"} · ${formatPrice(priceCents)}`}
    </button>
  );
}

export function BuyTrackButton({
  release,
  track,
}: {
  release: PurchaseRelease;
  track: Pick<Track, "id" | "title" | "digital_price_cents">;
}) {
  const { items, addItem, setOpen } = useCart();
  const price = trackPrice(track);
  if (!price || price <= 0) return null;
  const fullRelease = items.some(
    (i) => i.kind === "digital_release" && i.releaseId === release.id,
  );
  const inCart = items.some(
    (i) =>
      i.kind === "digital_track" &&
      i.releaseId === release.id &&
      i.trackId === track.id,
  );
  return (
    <button
      type="button"
      aria-label={
        fullRelease
          ? `${track.title} is included in the full release in your cart`
          : inCart
            ? `Open cart for ${track.title}`
            : `Buy ${track.title} for ${formatPrice(price)}`
      }
      onClick={() => {
        if (fullRelease || inCart) setOpen(true);
        else
          addItem({
            kind: "digital_track",
            releaseId: release.id,
            trackId: track.id,
            releaseTitle: release.title,
            name: track.title,
            artistName: release.artist_name ?? "",
            catalogNumber: release.catalog_number,
            priceCents: price,
            coverUrl: release.cover_url,
          });
      }}
      className="inline-flex min-h-10 min-w-28 shrink-0 items-center justify-center gap-2 border border-gold/50 px-3 py-2 text-[0.68rem] uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-night"
    >
      <ShoppingBag size={12} aria-hidden />
      {fullRelease
        ? "EP in cart"
        : inCart
          ? "In cart"
          : `Buy · ${formatPrice(price)}`}
    </button>
  );
}
