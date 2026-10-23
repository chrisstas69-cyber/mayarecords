import source from "../../../data/joeski-remixes.json";
import artwork from "../../../data/joeski-remixes-artwork.json";
import reviewed from "../../../data/joeski-remixes-overrides.json";
import type { Remix, RemixSource } from "../remixes";

const covers: Record<string, { cover_url: string | null }> = artwork;
const overrides: Record<string, { display_title: string }> = reviewed;

export const JOESKI_REMIXES: Remix[] = source.map((row) => {
  const status = row.beatport_status;
  if (status !== "verified" && status !== "different_mix" && status !== "not_on_beatport") {
    throw new Error(`Unknown Beatport status for remix ${row.id}`);
  }
  const remix: RemixSource = { ...row, beatport_status: status };
  return {
    ...remix,
    cover_url: covers[String(row.id)]?.cover_url ?? null,
    ...(overrides[String(row.id)] ? { display_title: overrides[String(row.id)].display_title } : {}),
  };
});
