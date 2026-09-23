#!/usr/bin/env python3
"""
One-time: download Maya Recordings' audio previews from Labelworx.

Setup (once, in Terminal):
    pip3 install playwright
    playwright install chromium

Run:
    python3 scripts/labelworx-scrape-audio.py

A real Chrome window opens. Log into Labelworx in it, your normal login —
this script never sees your password, it just waits for you. Once you're
on the LabelWorx dashboard, go back to the terminal and press Enter. It
then runs unattended.

Reusable for other labels/imprints on the same Labelworx account later:
change RECORD_LABEL below and re-run into a different OUT folder.

Output (gitignored, never committed):
  catalog/labelworx-audio/<CAT>/<CAT>-<pos>-<title>.mp3   (jPlayer sample clip)
  catalog/labelworx-audio/<CAT>/<CAT>-<pos>-<title>.wav   (only if a real download link exists — see note below)
  catalog/labelworx-audio/manifest.json                    (what was actually found, so nothing repeats on rerun)

IMPORTANT CAVEAT: the "sample" Labelworx serves in the browser is a short
promo clip (in my test: 2:40 of a 4:10 track), not necessarily the full
master. This script also looks for a real WAV download link per track and
grabs it if one exists, but I haven't confirmed the account exposes full
masters for re-download — the manifest will tell us for sure once this runs.
If wav_saved stays false across the board, the real masters need to come
from wherever the original production files live, not from Labelworx.

Safe to re-run: skips anything already downloaded.
"""
import json
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "catalog/labelworx-audio"
# A separate Chrome profile just for this script — never your everyday one,
# so it never conflicts with Chrome you already have open. Uses the real
# Chrome browser (channel="chrome"), not a bundled test build, since some
# login pages are stricter with automated/test browsers. You'll log into
# Labelworx once here; it's remembered for future runs.
CHROME_PROFILE_DIR = Path.home() / ".labelworx-scrape-profile"
BASE = "https://lms.labelworx.com"


def normalize_cat(raw: str) -> str:
    m = re.search(r"(\d{3,4})", raw or "")
    if not m:
        return re.sub(r"[^A-Za-z0-9]+", "-", raw or "unknown") or "unknown"
    n = int(m.group(1))
    return f"MAYA{n:03d}" if n <= 999 else raw


def get_release_list(page) -> list[tuple[str, str]]:
    page.goto(f"{BASE}/?option=releases&release_status=0")
    page.wait_for_load_state("domcontentloaded")

    def scrape():
        return page.eval_on_selector_all(
            "table tr",
            """trs => trs.map(tr => {
                const a = tr.children[1] && tr.children[1].querySelector('a[href*="release_id"]');
                if (!a) return null;
                const m = a.getAttribute('href').match(/release_id=(\\d+)/);
                return m ? [a.textContent.trim(), m[1]] : null;
            }).filter(Boolean)""",
        )

    # Labelworx keeps pagination state server-side per session, so URL params
    # alone don't reset it — click the page-1 link first if one is present.
    one = page.locator('a:text-is("1")').last
    if one.count():
        one.click()
        page.wait_for_load_state("domcontentloaded")
    rows = scrape()

    two = page.locator('a:text-is("2")').last
    if two.count():
        two.click()
        page.wait_for_load_state("domcontentloaded")
        rows += scrape()

    seen, out = set(), []
    for cat, rid in rows:
        if not cat:
            continue
        norm = normalize_cat(cat)
        if norm in seen:
            continue
        seen.add(norm)
        out.append((norm, rid))
    return out


def get_tracks(page, release_id: str) -> list[tuple[str, str, str]]:
    """Returns (track_id, position, title) for one release.

    The per-track "Update & Upload Files" links aren't real <a href> links —
    they're onclick="upd_trk(track_id, release_id)" JS handlers. Parse those.
    """
    page.goto(f"{BASE}/?option=releases&page=details&release_id={release_id}")
    try:
        # The Disc 1 tracklist renders after the page itself; releases with no tracks never get one.
        page.wait_for_selector('a[onclick*="upd_trk"]', timeout=12000)
    except Exception:
        return []
    return page.eval_on_selector_all(
        'a[onclick*="upd_trk"]',
        """as => as.map((a, i) => {
            const m = (a.getAttribute('onclick') || '').match(/upd_trk\\((\\d+)/);
            const row = a.closest('tr');
            const pos = row ? row.children[0].textContent.trim() : String(i + 1);
            const title = row ? row.children[4].textContent.trim() + (row.children[5] ? ' (' + row.children[5].textContent.trim() + ')' : '') : '';
            return m ? [m[1], pos, title] : null;
        }).filter(Boolean)""",
    )


def grab_track_audio(page, track_id: str, release_id: str) -> dict:
    """Open the track page, press play on the sample, read the <audio> src jPlayer sets."""
    found = {"sample_url": None, "wav_url": None}
    page.goto(f"{BASE}/?option=releases&page=mixdetails&track_id={track_id}&release_id={release_id}")
    play_btn = page.locator(f"a.jp-play#track_{track_id}")
    try:
        play_btn.wait_for(state="attached", timeout=10000)
    except Exception:
        pass
    if play_btn.count():
        page.wait_for_load_state("load")
        read_src = "() => { const a = document.querySelector('audio'); return a ? (a.currentSrc || a.src) : ''; }"
        # jPlayer ignores clicks until it has initialised, so retry the click a few times.
        for _ in range(8):
            play_btn.click()
            for _ in range(5):
                src = page.evaluate(read_src)
                if src and ".mp3" in src:
                    found["sample_url"] = src
                    break
                page.wait_for_timeout(200)
            if found["sample_url"]:
                break
        page.evaluate("() => { const a = document.querySelector('audio'); if (a) a.pause(); }")

    dl = page.locator('a[href$=".wav"], a:has-text("Download WAV"), a:has-text("Download Master")').first
    if dl.count():
        href = dl.get_attribute("href")
        if href:
            found["wav_url"] = href if href.startswith("http") else BASE + href
    return found


def save_url(context, url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    try:
        resp = context.request.get(url)
        if resp.status != 200:
            return False
        dest.write_bytes(resp.body())
        return True
    except Exception as e:
        print(f"    download failed: {e}")
        return False


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    with sync_playwright() as p:
        # channel="chrome" + your real profile dir = it looks like your normal
        # browser, already logged in, no automated-login page to get blocked on.
        context = p.chromium.launch_persistent_context(
            str(CHROME_PROFILE_DIR), channel="chrome", headless=False
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(BASE)

        if "login" in page.url.lower() or page.locator('input[type="password"]').count():
            input(
                "\nA separate Chrome window just opened to Labelworx (not your normal one).\n"
                "Log in there with your normal Labelworx login — this script never sees it.\n"
                "Once you're on the LabelWorx dashboard, come back here and press Enter...\n"
            )

        releases = get_release_list(page)
        only = os.environ.get("ONLY")
        if only:
            releases = [r for r in releases if r[0] in only.split(",")]
        print(f"{len(releases)} releases found. Starting...\n")

        for i, (cat, rid) in enumerate(releases, 1):
            rel_dir = OUT / cat
            rel_dir.mkdir(exist_ok=True)
            tracks = get_tracks(page, rid)
            print(f"[{i}/{len(releases)}] {cat}: {len(tracks)} tracks")

            for track_id, pos, title in tracks:
                key = f"{cat}-{pos}"
                prev = manifest.get(key, {})
                if prev.get("checked") and (prev.get("sample_url") or not prev.get("sample_saved")):
                    continue
                safe_title = re.sub(r"[^\w\- ]+", "", title)[:60].strip() or track_id
                found = grab_track_audio(page, track_id, rid)

                entry = {"release_id": rid, "track_id": track_id, "title": title, "sample_saved": False, "wav_saved": False, "checked": True}
                entry["sample_url"] = found["sample_url"]
                if found["sample_url"]:
                    entry["sample_saved"] = save_url(context, found["sample_url"], rel_dir / f"{cat}-{pos}-{safe_title}.mp3")
                if found["wav_url"]:
                    entry["wav_saved"] = save_url(context, found["wav_url"], rel_dir / f"{cat}-{pos}-{safe_title}.wav")

                manifest[key] = entry
                manifest_path.write_text(json.dumps(manifest, indent=2))

        context.close()

    got_sample = sum(1 for v in manifest.values() if v.get("sample_saved"))
    got_wav = sum(1 for v in manifest.values() if v.get("wav_saved"))
    print(f"\nDone. {got_sample} sample clips, {got_wav} full WAVs saved to {OUT}")
    if got_wav == 0:
        print("No full WAV masters were found for re-download — Labelworx only exposed preview samples.")


if __name__ == "__main__":
    main()
