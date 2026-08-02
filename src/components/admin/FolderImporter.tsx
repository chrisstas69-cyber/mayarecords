"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, FolderOpen, Play, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMediaFile } from "@/lib/uploads";
import { saveRelease } from "@/lib/actions/releases";
import { Button, Field, Notice, Select, Spinner, TextInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

interface TrackFile {
  file: File;
  title: string;
  position: number;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

interface FolderRelease {
  folderName: string;
  catalogNumber: string;
  title: string;
  artistName: string;
  coverFile: File | null;
  coverStatus: "pending" | "uploading" | "success" | "error" | "none";
  coverUrl?: string;
  tracks: TrackFile[];
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  existingId?: string;
  error?: string;
  include: boolean;
}

export function FolderImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<"upload" | "review" | "uploading" | "done">("upload");
  const [releases, setReleases] = useState<FolderRelease[]>([]);
  const [artists, setArtists] = useState<Array<{ id: string; name: string }>>([]);
  const [globalArtist, setGlobalArtist] = useState("Joeski");
  const [globalState, setGlobalState] = useState<"draft" | "published">("draft");
  const [concurrency, setConcurrency] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load existing artists for defaults
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("artists")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setArtists(data);
      });
  }, []);

  // Parse and group selected/dropped files
  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    if (files.length === 0) return;

    const groups: Record<string, File[]> = {};
    for (const file of files) {
      // webkitRelativePath contains "ParentDir/SubDir/file.ext"
      const path = file.webkitRelativePath || file.name;
      const parts = path.split("/");
      if (parts.length > 1) {
        // Group by direct subfolder name (catalog number)
        const groupName = parts[parts.length - 2];
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(file);
      } else {
        // Files uploaded flat
        const groupName = "FLAT_FILES";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(file);
      }
    }

    if (Object.keys(groups).length === 1 && groups["FLAT_FILES"]) {
      setError("Please drop a directory containing subfolders (one per release) rather than individual files.");
      return;
    }

    delete groups["FLAT_FILES"]; // Discard files placed in root

    const folderReleases: FolderRelease[] = Object.entries(groups).map(([folderName, groupFiles]) => {
      const catalogNumber = folderName.trim().toUpperCase();

      // Cover Art Detection
      const imageFiles = groupFiles.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
      const coverFile =
        imageFiles.find((f) => /cover|artwork|front/i.test(f.name)) || imageFiles[0] || null;

      // Track Audio Detection
      const audioFiles = groupFiles.filter((f) => /\.(mp3|wav|aiff|flac)$/i.test(f.name));
      audioFiles.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );

      const tracks: TrackFile[] = audioFiles.map((file, index) => {
        const match =
          file.name.match(/^\s*(\d+)\s*[-._)]\s*(.+)$/) || file.name.match(/^\s*(\d+)\s+(.+)$/);
        let position = index + 1;
        let title = file.name.replace(/\.[^.]+$/, "");

        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed)) position = parsed;
          title = match[2].replace(/\.[^.]+$/, "").trim();
        }

        return {
          file,
          title,
          position,
          status: "pending",
          progress: 0,
        };
      });

      return {
        folderName,
        catalogNumber,
        title: folderName.replace(/[-_]/g, " "),
        artistName: globalArtist,
        coverFile,
        coverStatus: coverFile ? "pending" : "none",
        tracks,
        status: "pending",
        progress: 0,
        include: true,
      };
    });

    // Check database to see which ones already exist
    const supabase = createClient();
    const catsToCheck = folderReleases.map((r) => r.catalogNumber);
    const { data: existing } = await supabase
      .from("releases")
      .select("id, title, catalog_number, catalog_number_normalized, artists(name)")
      .in("catalog_number_normalized", catsToCheck.map((c) => upperAlphaNum(c)));

    if (existing) {
      const existingMap = new Map<string, typeof existing[number]>();
      for (const e of existing) {
        existingMap.set(e.catalog_number_normalized as string, e);
      }

      for (const r of folderReleases) {
        const norm = upperAlphaNum(r.catalogNumber);
        const match = existingMap.get(norm);
        if (match) {
          r.existingId = match.id;
          r.title = match.title;
          r.artistName = (match.artists as any)?.name ?? globalArtist;
        }
      }
    }

    setReleases(folderReleases);
    setPhase("review");
  }, [globalArtist]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);

    const items = Array.from(e.dataTransfer.items || []);
    const files: File[] = [];

    // Traverse directories recursively using webkitGetAsEntry
    const traverse = async (entry: any, path: string = ""): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
        Object.defineProperty(file, "webkitRelativePath", {
          value: path ? `${path}/${file.name}` : file.name,
          writable: false,
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        };
        let entries = await readEntries();
        let all = [...entries];
        while (entries.length > 0) {
          entries = await readEntries();
          all.push(...entries);
        }
        for (const child of all) {
          await traverse(child, path ? `${path}/${entry.name}` : entry.name);
        }
      }
    };

    try {
      const traversePromises = items.map((item) => {
        const entry = item.webkitGetAsEntry();
        if (entry) return traverse(entry);
        return Promise.resolve();
      });
      await Promise.all(traversePromises);
      await processFiles(files);
    } catch (err) {
      setError("Failed to parse dropped directory. Use clicking to choose the folder.");
    }
  };

  const uploadAndImport = async () => {
    setPhase("uploading");

    const activeReleases = releases.filter((r) => r.include);

    // Sequentially upload and save each release
    for (const r of activeReleases) {
      r.status = "uploading";
      setReleases([...releases]);

      try {
        // Step 1: Resolve Artist ID
        let artistId = "";
        const matchArtist = artists.find((a) => a.name.toLowerCase() === r.artistName.toLowerCase());
        if (matchArtist) {
          artistId = matchArtist.id;
        } else {
          // Create new artist
          const { saveArtist } = await import("@/lib/actions/releases");
          const result = await saveArtist(null, { name: r.artistName });
          if (!result.ok || !result.data) {
            throw new Error(result.error ?? "Failed to create artist.");
          }
          artistId = result.data.id;
          // Add to local state list
          setArtists((prev) => [...prev, { id: artistId, name: r.artistName }]);
        }

        // Step 2: Upload Cover
        let coverUrl = r.coverUrl;
        if (r.coverFile) {
          r.coverStatus = "uploading";
          setReleases([...releases]);
          const uploaded = await uploadMediaFile(r.coverFile, "cover", {
            onProgress: (pct) => {
              r.progress = Math.round(pct * 0.1); // 10% weight
              setReleases([...releases]);
            },
          });
          coverUrl = uploaded.publicUrl;
          r.coverStatus = "success";
          r.coverUrl = coverUrl;
        }

        // Step 3: Upload Tracks
        const mappedTracks = [];
        for (const track of r.tracks) {
          track.status = "uploading";
          setReleases([...releases]);

          const uploadedTrack = await uploadMediaFile(track.file, "audio", {
            onProgress: (pct) => {
              track.progress = pct;
              // Calculate average progress
              const totalTracksProgress = r.tracks.reduce((sum, t) => sum + t.progress, 0);
              r.progress = Math.round(10 + (totalTracksProgress / r.tracks.length) * 0.8); // 80% weight
              setReleases([...releases]);
            },
          });

          track.status = "success";
          track.uploadedUrl = uploadedTrack.publicUrl;
          mappedTracks.push({
            title: track.title,
            position: track.position,
            preview_url: uploadedTrack.publicUrl,
          });
        }

        // Step 4: Save Release to DB
        const saveResult = await saveRelease(r.existingId || null, {
          title: r.title,
          catalog_number: r.catalogNumber,
          artist_id: artistId,
          cover_url: coverUrl,
          state: globalState,
          tracks: mappedTracks,
        });

        if (!saveResult.ok) {
          throw new Error(saveResult.error ?? "Failed to save release record.");
        }

        r.status = "success";
        r.progress = 100;
      } catch (err) {
        r.status = "error";
        r.error = err instanceof Error ? err.message : "Import failed.";
      } finally {
        setReleases([...releases]);
      }
    }

    setPhase("done");
  };

  const updateReleaseField = (index: number, field: "title" | "catalogNumber" | "artistName", value: string) => {
    const updated = [...releases];
    updated[index] = { ...updated[index], [field]: value };
    setReleases(updated);
  };

  const toggleRelease = (index: number) => {
    const updated = [...releases];
    updated[index] = { ...updated[index], include: !updated[index].include };
    setReleases(updated);
  };

  const activeCount = releases.filter((r) => r.include).length;

  if (phase === "done") {
    const succeeded = releases.filter((r) => r.status === "success" && r.include).length;
    const failed = releases.filter((r) => r.status === "error" && r.include).length;

    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok text-ok">
          <Check size={28} />
        </div>
        <h2 className="display-md mb-3 text-cream">Bulk import complete</h2>
        <p className="mb-2 text-sand">
          Successfully imported {succeeded} release{succeeded === 1 ? "" : "s"} as {globalState}s.
        </p>
        {failed > 0 && <p className="mb-6 text-sm text-error">{failed} releases encountered errors.</p>}
        <div className="flex flex-col gap-3 mt-8">
          <Button onClick={() => window.location.reload()}>Import another folder</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}

      {/* ── Selection Phase ── */}
      {phase === "upload" && (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-[260px] w-full flex-col items-center justify-center gap-3 border border-dashed px-6 py-12 transition-colors text-center",
              dragOver ? "border-gold bg-gold/5 text-gold" : "border-line text-stone hover:border-gold/50 hover:text-sand"
            )}
          >
            <FolderOpen size={42} strokeWidth={1.2} className="text-gold" />
            <p className="text-cream font-medium">Select or drag your catalog folder here</p>
            <p className="max-w-md text-xs leading-relaxed text-stone">
              Make sure each release is organized in its own subfolder named after the catalog number (e.g. `MYA-150`), containing artwork (JPG/PNG) and track files (MP3/WAV/FLAC).
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              await processFiles(files);
            }}
          />
        </div>
      )}

      {/* ── Review Phase ── */}
      {phase === "review" && (
        <div>
          <div className="mb-6 grid gap-4 rounded border border-line bg-surface p-5 sm:grid-cols-3">
            <Field label="Import as State">
              <Select value={globalState} onChange={(e) => setGlobalState(e.target.value as any)}>
                <option value="draft">Draft (recommended for review)</option>
                <option value="published">Published (goes live immediately)</option>
              </Select>
            </Field>
            <Field label="Default Artist">
              <TextInput value={globalArtist} onChange={(e) => setGlobalArtist(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button onClick={uploadAndImport} className="w-full" disabled={activeCount === 0}>
                Start Bulk Upload ({activeCount})
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="meta">Releases Detected ({releases.length})</h2>
            <button onClick={() => setPhase("upload")} className="text-xs text-stone hover:text-error">
              Start Over
            </button>
          </div>

          <div className="space-y-4">
            {releases.map((release, idx) => (
              <div
                key={release.folderName}
                className={cn(
                  "border p-5 transition-colors",
                  release.include ? "border-line bg-surface" : "border-faint/30 bg-night/20 opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={release.include}
                      onChange={() => toggleRelease(idx)}
                      className="h-4 w-4 rounded border-line bg-night text-gold focus:ring-0 focus:ring-offset-0"
                    />
                    <div>
                      <p className="text-xs text-stone">Folder name: {release.folderName}</p>
                      {release.existingId ? (
                        <span className="inline-block rounded bg-gold/10 px-2 py-0.5 text-[0.65rem] text-gold font-medium mt-1">
                          Exists in catalog (will update)
                        </span>
                      ) : (
                        <span className="inline-block rounded bg-ok/10 px-2 py-0.5 text-[0.65rem] text-ok font-medium mt-1">
                          New Release
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-24">
                      <Field label="Cat Number">
                        <TextInput
                          value={release.catalogNumber}
                          disabled={!release.include}
                          onChange={(e) => updateReleaseField(idx, "catalogNumber", e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="w-48">
                      <Field label="Title">
                        <TextInput
                          value={release.title}
                          disabled={!release.include}
                          onChange={(e) => updateReleaseField(idx, "title", e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="w-32">
                      <Field label="Artist">
                        <TextInput
                          value={release.artistName}
                          disabled={!release.include}
                          onChange={(e) => updateReleaseField(idx, "artistName", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-line/40 pt-3">
                  <div className="flex items-center gap-8 text-xs text-stone">
                    <span className="flex items-center gap-1.5">
                      {release.coverFile ? (
                        <span className="text-ok flex items-center gap-1">
                          <Check size={13} /> Cover Art: {release.coverFile.name}
                        </span>
                      ) : (
                        <span className="text-stone flex items-center gap-1">
                          <AlertTriangle size={13} /> No Cover Art
                        </span>
                      )}
                    </span>
                    <span>Tracks Detected: {release.tracks.length}</span>
                  </div>

                  {release.tracks.length > 0 && (
                    <div className="mt-2 text-xs text-faint">
                      <p className="font-semibold text-stone mb-1">Tracklist:</p>
                      <ul className="list-inside list-decimal space-y-0.5">
                        {release.tracks.map((t) => (
                          <li key={t.file.name}>
                            <span className="text-sand">{t.title}</span> (File: {t.file.name})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Uploading Phase ── */}
      {phase === "uploading" && (
        <div className="space-y-6">
          <div className="border border-line bg-surface p-5">
            <h3 className="text-sm font-semibold text-cream mb-2">Importing catalog releases...</h3>
            <p className="text-xs text-stone">Files are uploaded directly to Supabase storage. Keep this page open.</p>
          </div>

          <div className="space-y-4">
            {releases
              .filter((r) => r.include)
              .map((release) => (
                <div key={release.folderName} className="border border-line bg-surface p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-cream">{release.title}</h4>
                      <p className="text-xs text-stone">{release.catalogNumber} · {release.artistName}</p>
                    </div>
                    <div>
                      {release.status === "pending" && <span className="text-xs text-stone">Queued</span>}
                      {release.status === "uploading" && (
                        <span className="text-xs text-gold flex items-center gap-1.5">
                          <Spinner label="Uploading…" />
                        </span>
                      )}
                      {release.status === "success" && <span className="text-xs text-ok">✓ Complete</span>}
                      {release.status === "error" && (
                        <span className="text-xs text-error" title={release.error}>
                          ⚠ Failed: {release.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overall progress bar */}
                  {release.status === "uploading" && (
                    <div className="w-full bg-night h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-gold h-full transition-all duration-300"
                        style={{ width: `${release.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Tracks list upload status */}
                  {release.status === "uploading" && (
                    <div className="mt-4 space-y-1.5 pl-3 border-l border-line/40">
                      {release.tracks.map((t) => (
                        <div key={t.file.name} className="flex justify-between items-center text-xs">
                          <span className="text-stone">Track {t.position}: {t.title}</span>
                          <span className="text-faint">
                            {t.status === "pending" && "Queued"}
                            {t.status === "uploading" && `Uploading… ${t.progress}%`}
                            {t.status === "success" && "✓"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function upperAlphaNum(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
