"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "maya-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  setQuantity: (index: number, quantity: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

function itemKey(item: CartItem): string {
  return item.kind === "merch" ? `merch:${item.productId}:${item.size ?? ""}` : `digital:${item.releaseId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // corrupted cart — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const key = itemKey(item);
      const existing = prev.findIndex((i) => itemKey(i) === key);
      if (existing >= 0) {
        // digital items are one-per-order; merch bumps quantity
        if (item.kind === "digital_release") return prev;
        const next = [...prev];
        const target = next[existing];
        if (target.kind === "merch") next[existing] = { ...target, quantity: target.quantity + 1 };
        return next;
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index && item.kind === "merch" ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + (i.kind === "merch" ? i.quantity : 1), 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, setQuantity, open, setOpen }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

/** Nav cart button with count badge. */
export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Open cart (${count} item${count === 1 ? "" : "s"})`}
      className="relative p-2 text-sand transition-colors hover:text-cream"
    >
      <ShoppingBag size={18} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-night">
          {count}
        </span>
      )}
    </button>
  );
}

function CartDrawer() {
  const { items, open, setOpen, removeItem, setQuantity } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = items.reduce((sum, i) => sum + i.priceCents * (i.kind === "merch" ? i.quantity : 1), 0);

  function checkout() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(items);
      if (result.ok && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setError(result.error ?? "Checkout is unavailable right now.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-night/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="flex h-full w-full max-w-md flex-col border-l border-line bg-night-2">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="display-sm text-cream">Your Cart</h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="p-2 text-stone hover:text-cream">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag size={28} strokeWidth={1.2} className="text-faint" />
              <p className="text-sm text-stone">The crate is empty.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item, i) => (
                <li key={itemKey(item)} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-surface">
                    {(item.kind === "merch" ? item.imageUrl : item.coverUrl) && (
                      <Image
                        src={(item.kind === "merch" ? item.imageUrl : item.coverUrl)!}
                        alt=""
                        fill
                        sizes="64px"
                        className={cn("object-contain", item.kind === "digital_release" && "object-cover")}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-cream">{item.name}</p>
                    <p className="text-xs text-stone">
                      {item.kind === "merch"
                        ? item.size
                          ? `Size ${item.size}`
                          : "One size"
                        : `${item.artistName} · ${item.catalogNumber} · MP3 + WAV`}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {item.kind === "merch" ? (
                        <span className="flex items-center gap-2 border border-line px-2 py-1">
                          <button onClick={() => setQuantity(i, item.quantity - 1)} aria-label="Decrease quantity" className="text-stone hover:text-cream">
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-xs tabular-nums text-cream">{item.quantity}</span>
                          <button onClick={() => setQuantity(i, item.quantity + 1)} aria-label="Increase quantity" className="text-stone hover:text-cream">
                            <Plus size={12} />
                          </button>
                        </span>
                      ) : (
                        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-gold">Digital download</span>
                      )}
                      <button onClick={() => removeItem(i)} aria-label={`Remove ${item.name}`} className="text-stone transition-colors hover:text-error">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-cream">
                    {formatPrice(item.priceCents * (item.kind === "merch" ? item.quantity : 1))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="meta">Total</span>
              <span className="display-sm text-cream">{formatPrice(total)}</span>
            </div>
            {error && (
              <p role="alert" className="mb-3 border border-error/50 bg-error/10 px-3 py-2 text-xs text-error">
                {error}
              </p>
            )}
            <button
              onClick={checkout}
              disabled={pending}
              className="w-full bg-gold px-6 py-4 text-[0.78rem] font-medium uppercase tracking-[0.2em] text-night transition-colors hover:bg-gold-bright disabled:opacity-50"
            >
              {pending ? "Preparing checkout…" : "Checkout"}
            </button>
            <p className="mt-3 text-center text-[0.65rem] text-faint">
              Secure payment via Stripe · Digital downloads delivered instantly
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
