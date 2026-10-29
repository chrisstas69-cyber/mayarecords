# Artist enrichment — publication review

The owner-supplied 64-record package is imported verbatim into src/lib/data/artists-enrichment.json. Only empty artist fields are enriched; existing display names, bios, origins, photos, links, IDs and release relationships are preserved. Sources/confidence/notes are research metadata and are not displayed.

49 supplied files were validated as readable images and copied with their original filenames. Existing Joeski press photography remains selected. No bios or missing photos were generated. Inclusion in this PR is not verification of identity, image permission or current biographical claims.

## Before publishing
- The package README says the photos come from RA/Discogs and rights must be cleared before going live. Obtain permission/approved press assets; a public source URL is not permission.
- Review guessed J → J & S Productions, Nick → Nick & Danny Chatelain, Penn → Penn & Jabato.
- Review the 333/333-3ski shared person biography/photo against the collaboration display names. Slugs remain separate; no identity merge is performed.
- Review k-ax/kax aliases. Both slugs remain separate; missing bios/photos remain null.
- Some supplied biographies retain dated release plans (for example Harry Romero's 2022 plans). Review before calling these current biographies.
- Some source images are low resolution. No synthetic upscaling or invented portraits were used.

# Missing / needs review

## No bio (left null, do not invent)
- afrikali
- brooklyn-pirates
- cricco-castelli
- cultural-vibe
- de-no
- denney
- dj-taco
- el-jibaro
- hr-ski
- jesante
- joeski-javi-lopez-ruben-zurita
- k-ax
- kax
- ki-creighton
- leoesco
- los-bandidos
- m-j
- macondo
- max-martinez
- mikee-athens
- moses-mcclean
- mr-ski
- penn
- serious-intention
- shaboom-allstars

## No photo
- afrikali
- brooklyn-pirates
- de-no
- el-jibaro
- hr-ski
- j
- joeski-javi-lopez-ruben-zurita
- k-ax
- kax
- m-j
- macondo
- max-martinez
- mr-ski
- penn
- shaboom-allstars

## Low confidence / ambiguous mappings
- j -> J & S Productions (best guess)
- nick -> Nick & Danny Chatelain (best guess)
- penn -> David Penn & Jabato (best guess)
- 333-3ski shares data with 333; kax shares data with k-ax
- afrikali (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- brooklyn-pirates (Credited "Brooklyn Pirates Feat. Liberty". No matching RA profile found/accepted. No reliable bio found on RA or Discogs)
- de-no (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- el-jibaro (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- hr-ski (Harry Romero & Joeski collaboration project credit ("HR & SKI"); see harry-romero and joeski. No matching RA profile fou)
- j (Site slug "j" most likely comes from the "J&S" credit (Joeski and his wife Sil-la per Discogs). Low certainty on slug ma)
- joeski-javi-lopez-ruben-zurita (No research match (site-only collab/alias credit). Left empty on purpose.)
- k-ax (k-ax and kax slugs merged. No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No )
- kax (Shares person data with /k-ax (same artist, separate site page). k-ax and kax slugs merged. No matching RA profile found)
- leoesco (Not found in Discogs Maya label credits. RA profile matched No reliable bio found on RA or Discogs; left null.)
- m-j (Discogs credit "M* & J*" on Maya; no artist page resolved. No matching RA profile found/accepted. No reliable bio found )
- macondo (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- max-martinez (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- mr-ski (No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null. No usable image found.)
- nick (Site slug "nick" maps to the Maya credit "Nick & Danny Chatelain". No matching RA profile found/accepted.)
- penn (Site slug "penn" maps to the Maya credit "Penn & Jabato". No matching RA profile found/accepted. No reliable bio found o)
- shaboom-allstars (Not in Discogs Maya label list. No matching RA profile found/accepted. No reliable bio found on RA or Discogs; left null)

## Existing dependency audit
The lint setup exposed an existing npm audit report (Next critical; postcss, sharp, nanoid and source-map-js high). All five package versions are identical to main before this change; this PR does not introduce or remediate those advisories. Plan a separate tested dependency patch rather than silently mixing a framework update into artist content work.
