"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Check, FileAudio, FileVideo, FileText } from "lucide-react";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { Select } from "@/components/admin/ui";
import { formatBytes } from "@/lib/utils";
import type { AssetKind } from "@/lib/types";

export interface MediaItem {
  id: string;
  kind: AssetKind;
  title: string | null;
  public_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export function MediaLibrary({ assets }: { assets: MediaItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | AssetKind>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = filter === "all" ? assets : assets.filter((a) => a.kind === filter);

  async function copyUrl(item: MediaItem) {
    await navigator.clipboard.writeText(item.public_url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <UploadDropzone kind="cover" label="Upload artwork" value={null} onChange={() => router.refresh()} />
        <UploadDropzone kind="audio" label="Upload audio" value={null} onChange={() => router.refresh()} />
        <UploadDropzone kind="photo" label="Upload photo / press" value={null} onChange={() => router.refresh()} />
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="meta" role="status">
          {filtered.length} asset{filtered.length === 1 ? "" : "s"}
        </p>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="max-w-[180px]" aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="cover">Covers</option>
          <option value="photo">Photos</option>
          <option value="press">Press</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-line bg-surface px-4 py-16 text-center text-sm text-stone">
          Nothing here yet — drop files above to build the library.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((item) => {
            const isImage = item.mime_type?.startsWith("image/");
            return (
              <button
                key={item.id}
                onClick={() => copyUrl(item)}
                className="group border border-line bg-surface text-left transition-colors hover:border-gold/50"
                title="Click to copy URL"
              >
                <div className="relative aspect-square overflow-hidden bg-night">
                  {isImage ? (
                    <Image src={item.public_url} alt={item.title ?? ""} fill sizes="200px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone">
                      {item.kind === "audio" ? <FileAudio size={28} strokeWidth={1.2} /> : item.kind === "video" ? <FileVideo size={28} strokeWidth={1.2} /> : <FileText size={28} strokeWidth={1.2} />}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-night/70 opacity-0 transition-opacity group-hover:opacity-100">
                    {copied === item.id ? (
                      <span className="flex items-center gap-1.5 text-xs text-ok">
                        <Check size={13} /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-cream">
                        <Copy size={13} /> Copy URL
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs text-cream">{item.title ?? "Untitled"}</p>
                  <p className="text-[0.62rem] uppercase tracking-wider text-faint">
                    {item.kind} · {formatBytes(item.size_bytes)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
