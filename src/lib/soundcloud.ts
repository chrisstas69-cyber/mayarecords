export function canonicalSoundCloudTrack(
  value: string | null | undefined,
): string | null {
  if (!value || /[\\\s\u0000-\u001f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["soundcloud.com", "www.soundcloud.com"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (
      parts.length !== 2 ||
      !parts.every((part) => /^[a-z0-9_-]+$/i.test(part)) ||
      [
        "tracks",
        "sets",
        "albums",
        "reposts",
        "likes",
        "followers",
        "following",
        "popular-tracks",
      ].includes(parts[1])
    )
      return null;
    return `https://soundcloud.com/${parts.join("/")}`;
  } catch {
    return null;
  }
}

export function soundCloudEmbedUrl(value: string): string | null {
  const track = canonicalSoundCloudTrack(value);
  if (!track) return null;
  const params = new URLSearchParams({
    url: track,
    auto_play: "false",
    color: "#c89b5a",
    buying: "false",
    sharing: "true",
    download: "false",
    show_artwork: "true",
    show_user: "true",
    show_playcount: "false",
    single_active: "true",
    visual: "false",
  });
  return `https://w.soundcloud.com/player/?${params}`;
}
