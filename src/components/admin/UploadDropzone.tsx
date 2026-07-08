"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Music, UploadCloud, X } from "lucide-react";
import { uploadMediaFile, ACCEPT_FOR_KIND, MAX_SIZE_FOR_KIND } from "@/lib/uploads";
import { formatBytes, cn } from "@/lib/utils";

/**
 * Drag-and-drop + tap-to-pick uploader. Uploads straight to Supabase storage
 * and hands back the public URL. Kind decides bucket, accept list and size cap.
 */
export function UploadDropzone({
  kind,
  label,
  value,
  onChange,
  releaseId,
}: {
  kind: "cover" | "audio" | "photo";
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  releaseId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > MAX_SIZE_FOR_KIND[kind]) {
        setError(`That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_SIZE_FOR_KIND[kind])}.`);
        return;
      }
      try {
        setProgress(10);
        const uploaded = await uploadMediaFile(file, kind === "photo" ? "photo" : kind, {
          releaseId,
          onProgress: setProgress,
        });
        onChange(uploaded.publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed — try again.");
      } finally {
        setProgress(null);
      }
    },
    [kind, onChange, releaseId]
  );

  const isImage = kind !== "audio";

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream">{label}</span>

      {value ? (
        <div className="relative border border-line bg-surface">
          {isImage ? (
            <div className="relative aspect-square max-w-[240px]">
              <Image src={value} alt="Uploaded preview" fill sizes="240px" className="object-cover" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <Music size={18} className="shrink-0 text-gold" />
              <audio controls src={value} className="h-9 w-full" preload="metadata" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove file"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-night/80 text-cream transition-colors hover:text-error"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          disabled={progress !== null}
          className={cn(
            "flex min-h-[120px] w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-sm transition-colors",
            dragOver ? "border-gold bg-gold/5 text-gold" : "border-line text-stone hover:border-gold/50 hover:text-sand"
          )}
        >
          <UploadCloud size={22} strokeWidth={1.5} />
          {progress !== null ? (
            <span className="text-gold">Uploading… {progress}%</span>
          ) : (
            <>
              <span>
                Tap to choose {kind === "audio" ? "an audio file" : "an image"} or drag it here
              </span>
              <span className="text-xs text-faint">
                {kind === "audio" ? "MP3, WAV, AIFF or FLAC" : "JPG, PNG or WebP"} · up to{" "}
                {formatBytes(MAX_SIZE_FOR_KIND[kind])}
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_FOR_KIND[kind]}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
