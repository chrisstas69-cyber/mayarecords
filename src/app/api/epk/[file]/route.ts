import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPromoterEmail } from "@/lib/epk";

export const dynamic = "force-dynamic";

// Files live in private/epk (committed, but outside /public so they're never directly reachable).
const FILES: Record<string, { name: string; type: string }> = {
  "joeski-biography.pdf": { name: "Joeski - Biography.pdf", type: "application/pdf" },
  "joeski-tech-rider.pdf": { name: "Joeski - Tech Rider.pdf", type: "application/pdf" },
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const meta = FILES[file];
  if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await getPromoterEmail())) return NextResponse.json({ error: "Promoters only" }, { status: 403 });

  const body = await readFile(path.join(process.cwd(), "private", "epk", file));
  return new NextResponse(body, {
    headers: {
      "Content-Type": meta.type,
      "Content-Disposition": `attachment; filename="${meta.name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
