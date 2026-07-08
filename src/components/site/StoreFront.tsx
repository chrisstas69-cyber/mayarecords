"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ShoppingBag } from "lucide-react";
import { useCart } from "./Cart";
import { cn, formatPrice, formatYear } from "@/lib/utils";
import type { Product, Release } from "@/lib/types";

/** The store: merch grid + digital catalog. Client-side for cart interactions. */
export function StoreFront({ products, releases }: { products: Product[]; releases: Release[] }) {
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
            Buy any Maya release direct from the label — every purchase includes MP3 and WAV, delivered instantly.
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
          <span className="display-sm text-faint">{product.name.charAt(0)}</span>
        )}
        <span className="absolute left-3 top-3 text-[0.6rem] uppercase tracking-[0.25em] text-faint">
          {product.category}
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-cream">{product.name}</h3>
          <span className="shrink-0 text-sm text-gold">{formatPrice(product.price_cents, product.currency)}</span>
        </div>
        {product.description && <p className="mt-1 text-xs leading-relaxed text-stone">{product.description}</p>}
        {product.sizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${product.name} size`}>
            {product.sizes.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                className={cn(
                  "min-w-9 border px-2 py-1.5 text-xs transition-colors",
                  size === s ? "border-gold text-gold" : "border-line text-stone hover:text-cream"
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
      <Link href={`/releases/${release.slug}`} className="relative block aspect-square overflow-hidden border border-line bg-surface">
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
          <h3 className="truncate text-sm font-medium text-cream">{release.title}</h3>
          <span className="shrink-0 text-sm text-gold">{formatPrice(release.digital_price_cents)}</span>
        </div>
        <p className="text-xs text-stone">
          {release.artist_name} · {release.catalog_number} · {formatYear(release.release_date)}
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
          <Download size={13} /> Buy MP3 + WAV
        </button>
      </div>
    </div>
  );
}

/** Buy block for the release detail page. */
export function BuyReleaseButton({ release }: { release: Release }) {
  const { addItem } = useCart();
  const priceCents = release.digital_price_cents;
  if (!priceCents) return null;
  return (
    <button
      onClick={() =>
        addItem({
          kind: "digital_release",
          releaseId: release.id,
          name: release.title,
          artistName: release.artist_name ?? "",
          catalogNumber: release.catalog_number,
          priceCents,
          coverUrl: release.cover_url,
        })
      }
      className="flex w-full items-center justify-center gap-3 bg-gold px-6 py-4 text-[0.78rem] font-medium uppercase tracking-[0.2em] text-night transition-colors hover:bg-gold-bright"
    >
      <Download size={15} /> Buy MP3 + WAV · {formatPrice(priceCents)}
    </button>
  );
}
