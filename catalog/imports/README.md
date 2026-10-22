# Supplied release folder

`joeski-maya.json` maps the supplied filenames to reviewed catalog numbers and
track positions. Existing release titles and tracklists remain the source of
truth. AIFF tags supply duration, BPM and key, and fill missing genre/date fields.
The eight WAV copies contain the same decoded audio as their AIFF counterparts.

After regenerating the Labelworx/Discogs catalog, apply the folder overlay last:

```sh
python3 scripts/import-release-folder.py ~/Downloads/'joeski maya' --check
python3 scripts/import-release-folder.py ~/Downloads/'joeski maya'
```

The import adds 60-second MP3 previews only where no preview is linked, extracts
embedded artwork only where a cover is missing, and leaves original audio in
the supplied folder. It records original paths in the ignored `catalog/masters.json`
for the existing private-storage sync. A local master flag does not mean a full
release package is ready for purchase; Supabase Storage and checkout still need
configuration, and missing mixes must be supplied before selling a full release.

The manifest includes the missing MAYA098 **Before Sunrise** EP, with two tracks.
Its catalog number is documented in the manifest's source link; artwork and audio
metadata come from the supplied files. Ruben Zurita's **X** remains pending until
its catalog number is confirmed. Resolve its pending row and add its release
metadata to `new_releases` before re-running the importer.

## Manual release management

The existing `/admin/releases/new` wizard supports details, artwork, previews,
tracks, prices, a private master upload, drafts and publishing. `/admin/bulk`
supports bulk import. These need the Supabase connection and an admin account.
On 2026-10-22, the production project had no environment variables, and `/admin`
displayed its setup screen. Follow `SETUP-TOMORROW.md` to activate the portal.
