import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { getEdit, getMemberAccess, isEditReleased } from "@/lib/members";

export const dynamic = "force-dynamic";

const FORMATS = { wav: "audio/wav", mp3: "audio/mpeg" } as const;

/** Members-only edit delivery. ?format=wav|mp3, ?inline=1 streams for listening instead of downloading. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edit = getEdit(slug);
  if (!edit || !isEditReleased(edit)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = await getMemberAccess();
  if (!access.member) return NextResponse.json({ error: "Members only" }, { status: 403 });

  const format = req.nextUrl.searchParams.get("format") === "wav" ? "wav" : "mp3";
  const file = path.join(process.cwd(), "private-media", "edits", `${edit.slug}.${format}`);
  const info = await stat(file).catch(() => null);
  if (!info) return NextResponse.json({ error: "File not available" }, { status: 404 });

  const filename = `Joeski vs ${edit.original_artist} - ${edit.title} (Joeski Edit).${format}`;
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      "Content-Type": FORMATS[format],
      "Content-Length": String(info.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
