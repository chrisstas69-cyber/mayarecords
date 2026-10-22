import { NextResponse, type NextRequest } from "next/server";
import { privateMasterPath } from "@/lib/commerce/pricing";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Exchange a purchase token for a ten-minute URL in the private masters bucket. */
export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  const supabase = createServiceClient();
  if (!supabase) return fail("Downloads are not configured.", 503);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return fail("Invalid download link.", 404);
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from("download_tokens")
    .select("token, item_type, track_id, master_url, expires_at, max_downloads, download_count, releases(master_url)")
    .eq("token", token)
    .maybeSingle();
  if (tokenError) return fail("Could not validate the download link.", 500);
  if (!tokenRow) return fail("Invalid download link.", 404);
  const expiresAt = Date.parse(tokenRow.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return fail("This download link has expired — reply to your order email for a fresh one.", 410);
  }
  if (tokenRow.download_count >= tokenRow.max_downloads) return fail("Download limit reached for this link.", 429);

  const release = tokenRow.releases as unknown as { master_url: string | null } | null;
  let masterUrl: string | null = tokenRow.master_url;
  // Track tokens use only their snapshot; legacy release tokens may use the release master.
  if (tokenRow.item_type !== "digital_track") {
    if ((!tokenRow.item_type || tokenRow.item_type === "digital_release") && !tokenRow.track_id) {
      masterUrl ??= release?.master_url ?? null;
    } else {
      return fail("Invalid download link.", 404);
    }
  }
  const path = privateMasterPath(masterUrl);
  if (!path) return fail("The purchased master is unavailable — contact the label.", 404);

  const { data: signed, error: signingError } = await supabase.storage.from("masters").createSignedUrl(path, 60 * 10, {
    download: true,
  });
  if (signingError || !signed) return fail("Could not prepare the download.", 500);

  // Compare-and-swap prevents concurrent requests from losing a count or exceeding the limit.
  const { data: claimed, error: claimError } = await supabase
    .from("download_tokens")
    .update({ download_count: tokenRow.download_count + 1 })
    .eq("token", token)
    .eq("download_count", tokenRow.download_count)
    .lt("download_count", tokenRow.max_downloads)
    .gt("expires_at", new Date().toISOString())
    .select("token")
    .maybeSingle();
  if (claimError) return fail("Could not record the download. Please retry.", 500);
  if (!claimed) return fail("Download limit reached or another download is in progress. Please retry.", 429);

  return NextResponse.redirect(signed.signedUrl, { headers });
}
