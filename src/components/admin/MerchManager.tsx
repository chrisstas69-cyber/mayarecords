"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteProduct, saveProduct } from "@/lib/actions/commerce";
import { Button, Field, Notice, Select, TextArea, TextInput } from "@/components/admin/ui";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function MerchManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = editing === "new" ? null : editing;
  const [form, setForm] = useState({
    name: "",
    category: "apparel",
    description: "",
    price: "",
    image_url: null as string | null,
    sizes_raw: "",
    active: true,
  });

  function open(target: Product | "new") {
    setEditing(target);
    setError(null);
    if (target === "new") {
      setForm({ name: "", category: "apparel", description: "", price: "", image_url: null, sizes_raw: "", active: true });
    } else {
      setForm({
        name: target.name,
        category: target.category,
        description: target.description ?? "",
        price: (target.price_cents / 100).toFixed(2).replace(/\.00$/, ""),
        image_url: target.image_url,
        sizes_raw: target.sizes.join(", "),
        active: target.active,
      });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveProduct(current?.id ?? null, form);
      if (!result.ok) {
        setError(result.error ?? "Could not save the product.");
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    startTransition(async () => {
      await deleteProduct(product.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => open("new")}>
          <Plus size={15} /> Add Product
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className={cn("border border-line bg-surface p-4", !product.active && "opacity-50")}>
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-night">
                {product.image_url && (
                  <Image src={product.image_url} alt="" fill sizes="56px" className="object-contain p-1.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-cream">{product.name}</p>
                <p className="text-xs text-stone">
                  {product.category} · {formatPrice(product.price_cents, product.currency)}
                  {!product.active && " · hidden"}
                </p>
              </div>
              <button onClick={() => open(product)} aria-label={`Edit ${product.name}`} className="p-2 text-stone hover:text-gold">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(product)} aria-label={`Delete ${product.name}`} className="p-2 text-stone hover:text-error">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="border border-line bg-surface px-4 py-14 text-center text-sm text-stone sm:col-span-2 lg:col-span-3">
            No products yet — add the first piece.
          </p>
        )}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex justify-end bg-night/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-night-2 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="display-sm text-cream">{current ? `Edit ${current.name}` : "New Product"}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="p-2 text-stone hover:text-cream">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <Field label="Name">
                <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="apparel">Apparel</option>
                    <option value="hat">Hat</option>
                    <option value="accessory">Accessory</option>
                    <option value="vinyl">Vinyl</option>
                  </Select>
                </Field>
                <Field label="Price (USD)">
                  <TextInput inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="38" required />
                </Field>
              </div>
              <Field label="Description">
                <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <UploadDropzone kind="photo" label="Product image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
              <Field label="Sizes" hint='Comma-separated, e.g. "S, M, L, XL". Leave empty for one-size.'>
                <TextInput value={form.sizes_raw} onChange={(e) => setForm({ ...form, sizes_raw: e.target.value })} placeholder="S, M, L, XL" />
              </Field>
              <label className="flex items-center gap-3 border border-line bg-surface px-4 py-3.5 text-sm text-sand">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Visible in the store
              </label>

              {error && <Notice tone="error">{error}</Notice>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Saving…" : "Save Product"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
