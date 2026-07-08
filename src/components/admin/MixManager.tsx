"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Music, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteMix, saveMix } from "@/lib/actions/commerce";
import { uploadMixAudio } from "@/lib/uploads";
import { Button, Field, Notice, Select, StateBadge, TextArea, TextInput } from "@/components/admin/ui";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Mix, PublishState } from "@/lib/types";

export function MixManager({ mixes }: { mixes: Mix[] }) {
  const router = useRouter();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Mix | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const current = editing === "new" ? null : editing;
  const [form, setForm] = useState({
    title: "",
    recorded_on: "",
    duration_minutes: "",
    description: "",
    cover_url: null as string | null,
    audio_url: null as string | null,
    external_url: "",
    tracklist: "",
    state: "draft" as PublishState,
    featured: false,
  });

  function open(target: Mix | "new") {
    setEditing(target);
    setError(null);
    if (target === "new") {
      setForm({ title: "", recorded_on: "", duration_minutes: "", description: "", cover_url: null, audio_url: null, external_url: "", tracklist: "", state: "draft", featured: false });
    } else {
      setForm({
        title: target.title,
        recorded_on: target.recorded_on ?? "",
        duration_minutes: target.duration_seconds ? String(Math.round(target.duration_seconds / 60)) : "",
        description: target.description ?? "",
        cover_url: target.cover_url,
        audio_url: target.audio_url,
        external_url: target.external_url ?? "",
        tracklist: target.tracklist ?? "",
        state: target.state,
        featured: target.featured,
      });
    }
  }

  async function handleAudioFile(file: File) {
    setError(null);
    try {
      setAudioProgress(5);
      const uploaded = await uploadMixAudio(file, setAudioProgress);
      setForm((f) => ({ ...f, audio_url: uploaded.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio upload failed.");
    } finally {
      setAudioProgress(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveMix(current?.id ?? null, form);
      if (!result.ok) {
        setError(result.error ?? "Could not save the mix.");
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function remove(mix: Mix) {
    if (!window.confirm(`Delete “${mix.title}”?`)) return;
    startTransition(async () => {
      await deleteMix(mix.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => open("new")}>
          <Plus size={15} /> Add Mix
        </Button>
      </div>

      <div className="space-y-3">
        {mixes.map((mix) => (
          <div key={mix.id} className="flex items-center gap-4 border border-line bg-surface p-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-night">
              {mix.cover_url && <Image src={mix.cover_url} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">{mix.title}</p>
              <p className="text-xs text-stone">
                {formatDate(mix.recorded_on)} · {formatDuration(mix.duration_seconds)} ·{" "}
                {mix.audio_url ? "hosted audio" : mix.external_url ? "external link" : "no audio yet"}
              </p>
            </div>
            <StateBadge state={mix.state} />
            <button onClick={() => open(mix)} aria-label={`Edit ${mix.title}`} className="p-2 text-stone hover:text-gold">
              <Pencil size={15} />
            </button>
            <button onClick={() => remove(mix)} aria-label={`Delete ${mix.title}`} className="p-2 text-stone hover:text-error">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {mixes.length === 0 && (
          <p className="border border-line bg-surface px-4 py-14 text-center text-sm text-stone">
            No mixes yet — add the first session.
          </p>
        )}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex justify-end bg-night/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-night-2 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="display-sm text-cream">{current ? "Edit Mix" : "New Mix"}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="p-2 text-stone hover:text-cream">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <Field label="Title">
                <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Recorded on">
                  <TextInput type="date" value={form.recorded_on} onChange={(e) => setForm({ ...form, recorded_on: e.target.value })} />
                </Field>
                <Field label="Length (minutes)">
                  <TextInput inputMode="numeric" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value.replace(/\D/g, "") })} placeholder="83" />
                </Field>
              </div>
              <Field label="Description">
                <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <UploadDropzone kind="cover" label="Cover image" value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} />

              <div>
                <span className="mb-1.5 block text-sm font-medium text-cream">Mix audio (full recording)</span>
                {form.audio_url ? (
                  <div className="flex items-center gap-3 border border-line bg-surface p-3">
                    <Music size={16} className="shrink-0 text-gold" />
                    <audio controls src={form.audio_url} className="h-9 w-full" preload="metadata" />
                    <button type="button" onClick={() => setForm({ ...form, audio_url: null })} aria-label="Remove audio" className="p-1 text-stone hover:text-error">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audioProgress !== null}
                    className="w-full border border-dashed border-line px-4 py-6 text-sm text-stone transition-colors hover:border-gold/50 hover:text-sand"
                  >
                    {audioProgress !== null ? `Uploading… ${audioProgress}%` : "Tap to upload the recording (MP3, up to 250MB)"}
                  </button>
                )}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/aac"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAudioFile(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <Field label="External link (SoundCloud / Mixcloud)" hint="Shown when no hosted audio is uploaded.">
                <TextInput type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://soundcloud.com/…" />
              </Field>
              <Field label="Tracklist (optional)" hint="One track per line.">
                <TextArea rows={4} value={form.tracklist} onChange={(e) => setForm({ ...form, tracklist: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 items-end gap-4">
                <Field label="Status">
                  <Select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value as PublishState })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Field>
                <label className="flex items-center gap-2 border border-line bg-surface px-3 py-3.5 text-sm text-sand">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                  Featured
                </label>
              </div>

              {error && <Notice tone="error">{error}</Notice>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={pending || audioProgress !== null} className="flex-1">
                  {pending ? "Saving…" : "Save Mix"}
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
