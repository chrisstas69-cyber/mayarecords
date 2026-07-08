import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Digital delivery: exchanges a purchase token for a short-lived signed URL
 * to the release master in the PRIVATE `masters` bucket.
 * Tokens expire after 7 days and allow 5 downloads (see 0002_commerce.sql).
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Downloads are not configured." }, { status: 503 });

  const { data: tokenRow } = await supabase
    .from("download_tokens")
    .select("token, expires_at, max_downloads, download_count, releases(title, master_url)")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) return NextResponse.json({ error: "Invalid download link." }, { status: 404 });
  if (new Date(tokenRow.expires_at) < new Date())
    return NextResponse.json({ error: "This download link has expired — reply to your order email for a fresh one." }, { status: 410 });
  if (tokenRow.download_count >= tokenRow.max_downloads)
    return NextResponse.json({ error: "Download limit reached for this link." }, { status: 429 });

  const release = tokenRow.releases as unknown as { title: string; master_url: string | null } | null;
  if (!release?.master_url)
    return NextResponse.json(
      { error: "The master file for this release hasn't been uploaded yet — contact the label and we'll sort it." },
      { status: 404 }
    );

  // master_url is stored as "masters/<path>" — strip the bucket prefix.
  const path = release.master_url.replace(/^masters\//, "");
  const { data: signed, error } = await supabase.storage.from("masters").createSignedUrl(path, 60 * 10, {
    download: true,
  });
  if (error || !signed) return NextResponse.json({ error: "Could not prepare the download." }, { status: 500 });

  await supabase
    .from("download_tokens")
    .update({ download_count: tokenRow.download_count + 1 })
    .eq("token", token);

  return NextResponse.redirect(signed.signedUrl);
}
