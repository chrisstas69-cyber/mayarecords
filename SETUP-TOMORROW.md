# Setup: Supabase + Stripe (about 45 minutes)

Do these in order. **Never paste keys into chat.** Put them in `.env.local` (step 3); Claude reads them from there.

---

## Decision first: Supabase plan

| | Free | Pro ($25/mo) |
|---|---|---|
| Storage | 1 GB | 100 GB |
| Max file size | 50 MB | up to 500 GB (you set it) |
| Selling WAVs / serving full edits | ❌ WAVs are 60–100 MB each | ✅ |

**Start on Free** to test the site, promoters and members. **Upgrade to Pro before you sell WAVs** or host the full edits.

Build it in **your own** Supabase account now. When Joeski should own it, use *Project Settings → General → Transfer project* to move it to his organization. The data, keys and site all stay the same.

---

## 1. Create the Supabase project (5 min)

1. Go to supabase.com → **New project**.
   - Name: `maya-records`
   - Region: East US
2. Save the database password in your password manager.
3. Wait about 2 minutes for it to finish provisioning.

## 2. Create the database (5 min)

Go to **SQL Editor → New query**. Paste in each file below, one at a time, and click **Run** after each:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_commerce.sql`
3. `supabase/migrations/0003_members.sql`
4. `supabase/migrations/0004_promoters.sql`
5. `supabase/seed.sql` (adds the mixes and merch)

## 3. Keys → `.env.local` (5 min)

Go to **Project Settings → API**. Then in Terminal:

```bash
cd ~/Projects/joeski-platform
cp .env.example .env.local
open -e .env.local
```

Fill in these values:

- `NEXT_PUBLIC_SUPABASE_URL`: the Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY`: the `service_role` key. This works like a root password: never share it, never commit it.
- `NEXT_PUBLIC_SITE_URL`: `https://joeski-platform.vercel.app`
- `EPK_SECRET`: run `openssl rand -hex 32` and paste the result

Then tell Claude **"keys are in .env.local"**. Claude will copy them into Vercel (production and preview) without them ever appearing in chat.

## 4. Load the catalog (10–20 min, unattended)

```bash
python3 scripts/sync-to-supabase.py
```

This uploads the 255 releases, their covers and tracks, the previews and the 11 edits.

**On Pro only:**

1. First go to **Storage → Settings** and set the upload limit to 500 MB.
2. Then run:

```bash
python3 scripts/sync-to-supabase.py --masters
```

This zips the WAV masters for the 20 releases you hold masters for. The **Buy** button appears on those releases.

## 5. Your admin login (3 min)

1. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to `https://joeski-platform.vercel.app`.
2. Open `https://joeski-platform.vercel.app/admin/login` and sign up.
3. In the **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
   ```
4. Open `/admin/audience` to see promoters, fans and members.

## 6. Stripe (10 min). Test mode first.

1. Go to dashboard.stripe.com and switch on **Test mode** (top right).
2. **Developers → API keys**: copy the **Secret key** into `.env.local` as `STRIPE_SECRET_KEY`.
3. **Product catalog → Add product**:
   - Name: "Joeski Members"
   - Price: **$10.00, Recurring, Monthly**
   - Save
4. Copy the price ID (starts with `price_…`) into `.env.local` as `STRIPE_MEMBERS_PRICE_ID`.
5. Tell Claude **"stripe keys are in .env.local"**. Claude pushes them to Vercel and redeploys.
6. Test on the live site with card `4242 4242 4242 4242`, any future date and any CVC:
   - Join Members for $10/mo. The edits unlock and the WAV downloads work.
   - Buy a release (for example MAYA188 Tierra Linda). You should get a download link and a ZIP of the WAVs.
7. When everything works, repeat steps 2–4 in **live mode** with live keys.

---

## Still needs a decision

- **Booking and demo emails.** The site shows `bookings@armige.com` and `demos@mayarecords.com`, and both are unconfirmed (`src/lib/data/seed.ts` → `BOOKING`).
- **Release prices** are placeholders: 1 track $1.99, 2–3 tracks $3.99, 4–6 tracks $5.99, 7+ tracks $9.99. Change them per release in the admin.
- **Masters.** Only 20 releases have full WAVs on hand, from the archive folder. Labelworx only gives preview clips. For the rest you'd need masters from Joeski's drives. Drop them in `~/Downloads/Maya Records Archive/01 Releases by Catalog Number/MAYAxxx/WAV/`, then rerun `merge-labelworx.py` and `sync-to-supabase.py --masters`.
- **Members on a new device.** Access is tied to the browser the member paid on. Next step: a "restore access" link emailed to members.
- **Copyright on the edits.** Charging for access to unlicensed edits is a DMCA risk, and could get the Stripe account shut down.
