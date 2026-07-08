"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { checkCatalogNumber, saveRelease } from "@/lib/actions/releases";
import { Button, Field, Notice, Select, Spinner, TextArea, TextInput } from "@/components/admin/ui";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { cn, formatDate } from "@/lib/utils";
import type { PublishState } from "@/lib/types";

export interface ArtistOption {
  id: string;
  name: string;
}

export interface WizardTrack {
  title: string;
  bpm: string;
  musical_key: string;
  preview_url: string | null;
}

export interface WizardData {
  title: string;
  catalog_number: string;
  artist_id: string;
  release_date: string;
  genre: string;
  description: string;
  credits: string;
  cover_url: string | null;
  preview_url: string | null;
  video_url: string;
  links_raw: string;
  featured: boolean;
  digital_price: string; // dollars; empty = not for sale
  master_url: string | null; // private masters-bucket path (WAV/ZIP for buyers)
  tracks: WizardTrack[];
}

const EMPTY: WizardData = {
  title: "",
  catalog_number: "",
  artist_id: "",
  release_date: "",
  genre: "",
  description: "",
  credits: "",
  cover_url: null,
  preview_url: null,
  video_url: "",
  links_raw: "",
  featured: false,
  digital_price: "",
  master_url: null,
  tracks: [{ title: "", bpm: "", musical_key: "", preview_url: null }],
};

const STEPS = ["Basic Info", "Cover & Media", "Audio & Links", "Review & Publish"] as const;
const GENRES = ["Tribal House", "Tech House", "Deep House", "Deep Techno", "Afro House", "House"];

/**
 * The single-release flow. Phone-first: one step on screen at a time, large
 * controls, autosaved draft. The same component powers desktop editing.
 */
export function ReleaseWizard({
  artists,
  releaseId: initialReleaseId,
  initial,
  initialState = "draft",
}: {
  artists: ArtistOption[];
  releaseId?: string;
  initial?: Partial<WizardData>;
  initialState?: PublishState;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...EMPTY, ...initial });
  const [releaseId, setReleaseId] = useState<string | undefined>(initialReleaseId);
  const [error, setError] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [catalogWarning, setCatalogWarning] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [pending, startTransition] = useTransition();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditing = Boolean(initialReleaseId);

  const set = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  }, []);

  const payload = useMemo(
    () => ({
      title: data.title,
      catalog_number: data.catalog_number,
      artist_id: data.artist_id || undefined,
      release_date: data.release_date || undefined,
      genre: data.genre || undefined,
      description: data.description || undefined,
      credits: data.credits || undefined,
      cover_url: data.cover_url ?? undefined,
      preview_url: data.preview_url ?? undefined,
      video_url: data.video_url || undefined,
      links_raw: data.links_raw,
      featured: data.featured,
      digital_price_cents: data.digital_price.trim()
        ? Math.round(Number(data.digital_price) * 100) || null
        : null,
      master_url: data.master_url ?? undefined,
      tracks: data.tracks
        .filter((t) => t.title.trim())
        .map((t, i) => ({
          title: t.title,
          position: i + 1,
          bpm: t.bpm ? Number(t.bpm) : undefined,
          musical_key: t.musical_key || undefined,
          preview_url: t.preview_url ?? undefined,
        })),
    }),
    [data]
  );

  /** Autosave a draft 1.5s after the last edit (never while editing a published release). */
  useEffect(() => {
    if (published || (isEditing && initialState !== "draft")) return;
    if (!data.title.trim()) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      setAutosaveState("saving");
      void saveRelease(releaseId ?? null, { ...payload, state: "draft" }).then((result) => {
        if (result.ok && result.data) {
          setReleaseId(result.data.id);
          setAutosaveState("saved");
        } else {
          setAutosaveState("idle");
        }
      });
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, published]);

  /** Duplicate cat # check on blur. */
  const checkDuplicate = useCallback(() => {
    if (!data.catalog_number.trim()) return;
    void checkCatalogNumber(data.catalog_number, releaseId).then((result) => {
      setCatalogWarning(
        result.data?.duplicate ? `Heads up: ${data.catalog_number} is already used by “${result.data.title}”.` : null
      );
    });
  }, [data.catalog_number, releaseId]);

  const stepValid = useMemo(() => {
    if (step === 0) return data.title.trim() && data.catalog_number.trim() && data.artist_id;
    return true;
  }, [step, data]);

  function submit(state: PublishState) {
    setError(null);
    startTransition(async () => {
      const result = await saveRelease(releaseId ?? null, { ...payload, state });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setReleaseId(result.data?.id);
      if (state === "published") setPublished(true);
      else {
        router.push("/admin/releases");
        router.refresh();
      }
    });
  }

  const artistName = artists.find((a) => a.id === data.artist_id)?.name;

  /* ── Success state ── */
  if (published) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok text-ok">
          <Check size={28} />
        </div>
        <h2 className="display-md mb-3 text-cream">It&apos;s live.</h2>
        <p className="mb-8 text-sand">
          <span className="text-cream">{data.title}</span> ({data.catalog_number}) is published on the site.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/releases"
            target="_blank"
            className="bg-gold px-6 py-3.5 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-night transition-colors hover:bg-gold-bright"
          >
            View on Site
          </Link>
          <Link
            href="/admin/releases"
            className="border border-line px-6 py-3.5 text-[0.78rem] uppercase tracking-[0.16em] text-sand transition-colors hover:border-cream/40"
          >
            Back to Releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-1" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn("h-1 w-full transition-colors", i <= step ? "bg-gold" : "bg-faint/40", i < step && "cursor-pointer")}
              aria-label={`Step ${i + 1}: ${label}`}
              aria-current={i === step ? "step" : undefined}
            />
            <span className={cn("hidden text-[0.6rem] uppercase tracking-[0.14em] sm:block", i === step ? "text-gold" : "text-faint")}>
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-6 text-sm text-stone sm:hidden">
        Step {step + 1} of {STEPS.length} — <span className="text-gold">{STEPS[step]}</span>
      </p>

      {error && (
        <div className="mb-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* ── Step 1: Basic info ── */}
      {step === 0 && (
        <div className="space-y-5">
          <Field label="Artist">
            <Select value={data.artist_id} onChange={(e) => set("artist_id", e.target.value)} required>
              <option value="">Choose an artist…</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Release title">
            <TextInput
              value={data.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Roots & Wire"
              required
              autoFocus
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Catalog number" error={catalogWarning}>
              <TextInput
                value={data.catalog_number}
                onChange={(e) => set("catalog_number", e.target.value.toUpperCase())}
                onBlur={checkDuplicate}
                placeholder="MYA-151"
                required
              />
            </Field>
            <Field label="Release date">
              <TextInput type="date" value={data.release_date} onChange={(e) => set("release_date", e.target.value)} />
            </Field>
          </div>
          <Field label="Genre">
            <Select value={data.genre} onChange={(e) => set("genre", e.target.value)}>
              <option value="">Choose…</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description" hint="A few sentences for the release page — where it came from, what it's for.">
            <TextArea value={data.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      )}

      {/* ── Step 2: Cover & media ── */}
      {step === 1 && (
        <div className="space-y-6">
          <UploadDropzone kind="cover" label="Cover artwork" value={data.cover_url} onChange={(url) => set("cover_url", url)} releaseId={releaseId} />
          <Field label="Video URL (optional)" hint="A YouTube/Vimeo embed link for the release page.">
            <TextInput
              type="url"
              value={data.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
            />
          </Field>
          <Field label="Credits" hint="Writing, production, remix and mastering credits.">
            <TextArea value={data.credits} onChange={(e) => set("credits", e.target.value)} rows={3} />
          </Field>
        </div>
      )}

      {/* ── Step 3: Audio & links ── */}
      {step === 2 && (
        <div className="space-y-6">
          <UploadDropzone
            kind="audio"
            label="Release preview audio"
            value={data.preview_url}
            onChange={(url) => set("preview_url", url)}
            releaseId={releaseId}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-cream">Tracklist</span>
            <div className="space-y-3">
              {data.tracks.map((track, i) => (
                <div key={i} className="flex items-start gap-2 border border-line bg-surface p-3">
                  <GripVertical size={15} className="mt-4 shrink-0 text-faint" aria-hidden />
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_90px_90px]">
                    <TextInput
                      value={track.title}
                      onChange={(e) => {
                        const tracks = [...data.tracks];
                        tracks[i] = { ...track, title: e.target.value };
                        set("tracks", tracks);
                      }}
                      placeholder={`Track ${i + 1} title`}
                      aria-label={`Track ${i + 1} title`}
                    />
                    <TextInput
                      value={track.bpm}
                      inputMode="numeric"
                      onChange={(e) => {
                        const tracks = [...data.tracks];
                        tracks[i] = { ...track, bpm: e.target.value.replace(/\D/g, "") };
                        set("tracks", tracks);
                      }}
                      placeholder="BPM"
                      aria-label={`Track ${i + 1} BPM`}
                    />
                    <TextInput
                      value={track.musical_key}
                      onChange={(e) => {
                        const tracks = [...data.tracks];
                        tracks[i] = { ...track, musical_key: e.target.value };
                        set("tracks", tracks);
                      }}
                      placeholder="Key"
                      aria-label={`Track ${i + 1} key`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("tracks", data.tracks.filter((_, j) => j !== i))}
                    disabled={data.tracks.length === 1}
                    aria-label={`Remove track ${i + 1}`}
                    className="mt-3 p-1.5 text-stone transition-colors hover:text-error disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("tracks", [...data.tracks, { title: "", bpm: "", musical_key: "", preview_url: null }])}
              className="mt-3 flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-bright"
            >
              <Plus size={14} /> Add track
            </button>
          </div>

          {/* Sell direct: price + private master */}
          <div className="border border-line bg-surface p-4">
            <p className="mb-1 text-sm font-medium text-cream">Sell on the site (optional)</p>
            <p className="mb-4 text-xs text-stone">
              Set a price and upload the sale master — buyers get an instant MP3 + WAV download after checkout. The
              master file stays private.
            </p>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <Field label="Price (USD)">
                <TextInput
                  inputMode="decimal"
                  value={data.digital_price}
                  onChange={(e) => set("digital_price", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="2.99"
                />
              </Field>
              <MasterUpload value={data.master_url} onChange={(path) => set("master_url", path)} />
            </div>
          </div>

          <Field
            label="Streaming & purchase links"
            hint={'One per line as "Label | URL" — e.g. Beatport | https://beatport.com/…'}
          >
            <TextArea
              value={data.links_raw}
              onChange={(e) => set("links_raw", e.target.value)}
              rows={4}
              placeholder={"Beatport | https://…\nTraxsource | https://…\nSpotify | https://…"}
            />
          </Field>
        </div>
      )}

      {/* ── Step 4: Review & publish ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="border border-line bg-surface p-5">
            <p className="meta mb-4">This is how it will appear</p>
            <div className="flex gap-5">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-line bg-night">
                {data.cover_url ? (
                  <Image src={data.cover_url} alt="Cover preview" fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-wider text-faint">
                    No cover
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="display-sm text-cream">{data.title || "Untitled"}</p>
                <p className="mt-1 text-sm text-sand">{artistName ?? "No artist"}</p>
                <p className="mt-2 text-xs text-stone">
                  {data.catalog_number || "No cat #"} · {data.release_date ? formatDate(data.release_date) : "No date"}
                  {data.genre ? ` · ${data.genre}` : ""}
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <ReviewRow label="Tracks" ok={data.tracks.some((t) => t.title.trim())}>
                {data.tracks.filter((t) => t.title.trim()).map((t) => t.title).join(", ") || "None yet"}
              </ReviewRow>
              <ReviewRow label="Preview audio" ok={Boolean(data.preview_url)}>
                {data.preview_url ? "Uploaded" : "Not uploaded — the site will point to streaming links"}
              </ReviewRow>
              <ReviewRow label="Links" ok={Boolean(data.links_raw.trim())}>
                {data.links_raw.trim() ? `${data.links_raw.trim().split("\n").length} link(s)` : "None yet"}
              </ReviewRow>
              <ReviewRow label="Description" ok={Boolean(data.description.trim())}>
                {data.description.trim() ? "Written" : "Empty"}
              </ReviewRow>
            </dl>
          </div>

          <label className="flex items-center gap-3 border border-line bg-surface px-4 py-4 text-sm text-sand">
            <input
              type="checkbox"
              checked={data.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4"
            />
            Feature this release on the homepage
          </label>

          {catalogWarning && <Notice tone="error">{catalogWarning}</Notice>}
        </div>
      )}

      {/* Footer controls */}
      <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
        <div className="flex items-center gap-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <span />
          )}
          {autosaveState === "saving" && <Spinner label="Saving draft…" />}
          {autosaveState === "saved" && <span className="text-xs text-stone">Draft saved</span>}
        </div>

        <div className="flex items-center gap-3">
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <>
              <Button variant="ghost" disabled={pending} onClick={() => submit("draft")}>
                Save Draft
              </Button>
              <Button disabled={pending || !stepValid} onClick={() => submit("published")}>
                {pending ? "Publishing…" : "Publish"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MasterUpload({ value, onChange }: { value: string | null; onChange: (path: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream">Sale master (WAV or ZIP)</span>
      {value ? (
        <div className="flex items-center justify-between gap-3 border border-line bg-night px-3 py-3 text-xs text-sand">
          <span className="truncate">{value.split("/").pop()}</span>
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-stone hover:text-error">
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
          className="w-full border border-dashed border-line px-3 py-3 text-xs text-stone transition-colors hover:border-gold/50 hover:text-sand"
        >
          {progress !== null ? `Uploading… ${progress}%` : "Upload master file (up to 500MB)"}
        </button>
      )}
      {uploadError && (
        <p role="alert" className="mt-1.5 text-xs text-error">
          {uploadError}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="audio/wav,audio/x-wav,audio/aiff,application/zip,audio/flac"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setUploadError(null);
          if (file.size > 500 * 1024 * 1024) {
            setUploadError("That file is over 500MB — zip it or split it.");
            return;
          }
          try {
            const { uploadMasterFile } = await import("@/lib/uploads");
            setProgress(5);
            const uploaded = await uploadMasterFile(file, setProgress);
            onChange(uploaded.storagePath);
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setProgress(null);
          }
        }}
      />
    </div>
  );
}

function ReviewRow({ label, ok, children }: { label: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-stone">{label}</dt>
      <dd className={cn("min-w-0 flex-1 truncate", ok ? "text-cream" : "text-faint")}>{children}</dd>
    </div>
  );
}
