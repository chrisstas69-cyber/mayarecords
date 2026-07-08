"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveArtist } from "@/lib/actions/releases";
import { Button, Field, Notice, TextArea, TextInput } from "@/components/admin/ui";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import type { LinkItem } from "@/lib/types";

export interface AdminArtist {
  id: string;
  name: string;
  origin: string | null;
  bio: string | null;
  photo_url: string | null;
  links: LinkItem[];
  release_count: number;
}

export function ArtistManager({ artists }: { artists: AdminArtist[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminArtist | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = editing === "new" ? null : editing;
  const [form, setForm] = useState({ name: "", origin: "", bio: "", photo_url: null as string | null, links_raw: "" });

  function open(target: AdminArtist | "new") {
    setEditing(target);
    setError(null);
    if (target === "new") setForm({ name: "", origin: "", bio: "", photo_url: null, links_raw: "" });
    else
      setForm({
        name: target.name,
        origin: target.origin ?? "",
        bio: target.bio ?? "",
        photo_url: target.photo_url,
        links_raw: target.links.map((l) => `${l.label} | ${l.url}`).join("\n"),
      });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveArtist(current?.id ?? null, {
        name: form.name,
        origin: form.origin,
        bio: form.bio,
        photo_url: form.photo_url ?? undefined,
        links_raw: form.links_raw,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save artist.");
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => open("new")}>
          <Plus size={15} /> Add Artist
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <button
            key={artist.id}
            onClick={() => open(artist)}
            className="group flex items-center gap-4 border border-line bg-surface p-4 text-left transition-colors hover:border-gold/50"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-night">
              {artist.photo_url && <Image src={artist.photo_url} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-cream">{artist.name}</p>
              <p className="truncate text-xs text-stone">
                {artist.origin ?? "—"} · {artist.release_count} release{artist.release_count === 1 ? "" : "s"}
              </p>
            </div>
            <Pencil size={14} className="shrink-0 text-faint transition-colors group-hover:text-gold" />
          </button>
        ))}
      </div>

      {/* Edit drawer */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex justify-end bg-night/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-night-2 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="display-sm text-cream">{current ? `Edit ${current.name}` : "New Artist"}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="p-2 text-stone hover:text-cream">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <Field label="Name">
                <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </Field>
              <Field label="Origin" hint="City / country shown on the profile.">
                <TextInput value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Brooklyn, NY" />
              </Field>
              <Field label="Bio">
                <TextArea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} />
              </Field>
              <UploadDropzone
                kind="photo"
                label="Artist photo"
                value={form.photo_url}
                onChange={(url) => setForm({ ...form, photo_url: url })}
              />
              <Field label="Links" hint={'One per line as "Label | URL".'}>
                <TextArea
                  value={form.links_raw}
                  onChange={(e) => setForm({ ...form, links_raw: e.target.value })}
                  rows={3}
                  placeholder={"SoundCloud | https://…\nInstagram | https://…"}
                />
              </Field>

              {error && <Notice tone="error">{error}</Notice>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Saving…" : "Save Artist"}
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
