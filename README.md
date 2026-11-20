# GROOV HQ — Digital Menu

Next.js 15 · Tailwind · Framer Motion. Mobile-first QR menu with cinematic intro, cart (demo), and protected admin.

## Run locally (Cloudflare runtime, local D1 emulation)
```bash
npm install
echo "ADMIN_PASSWORD=choose-one" > .dev.vars
npm run preview        # builds and serves on a local Workers runtime
```

## Deploy to Cloudflare (Workers + D1)
Storage: **D1** holds the menu and orders (tables are created automatically on first request; `data/menu.json` seeds the first menu); uploaded photos are stored in D1 too (no R2 needed).
1. Cloudflare dashboard → Workers & Pages → Create → Import from GitHub → this repo.
2. Build command `npx opennextjs-cloudflare build`, deploy command `npx wrangler deploy`.
3. Settings → Variables and Secrets: add secret `ADMIN_PASSWORD` (and optionally `ADMIN_SECRET`). Admin and kitchen stay disabled without it.
4. The first deploy creates the D1 database `groov-hq-db` automatically. The Worker name in `wrangler.jsonc` must match your Cloudflare project name.
Or from a terminal: `npm run deploy`.

## Brand assets
- **Logo:** official logo at `public/brand/logo.png` (silver on transparent, extracted from the supplied artwork); Devanagari mark at `public/brand/logo-hindi.png`. It is shown unaltered everywhere.
- **Intro panther:** uses real black-panther photos graded to black and silver (`intro-1.webp` walking, `intro-2.webp` roaring; `hero.webp` and `branch.webp` for the menu banner and kiosk). For a video version, drop a licensed, optimised clip (H.264 MP4, ~1–2 MB, 720p, ≤4 s) in `public/intro/` and set `settings.introVideo` (e.g. `/intro/panther.mp4`).

## Menu data
Live menu is in D1 and edited at `/admin`; `data/menu.json` is only the first-run seed. Photos are Unsplash placeholders; upload real ones in `/admin` (stored in D1, served at `/media/...`).

## QR codes
Encode `https://YOUR-DOMAIN/?table=12` per table. Table number shows in the header and basket. `?intro=0` skips the intro.

## Orders, kitchen and kiosk
- **Table ordering:** customers scan `https://YOUR-DOMAIN/?table=N`, order, and follow progress at `/order/<id>` (Received → Preparing → Ready). Prices are recomputed on the server.
- **Kitchen screen:** `/kitchen` (admin password). New orders appear within ~3s; enable sound once per device.
- **Kiosk:** `/kiosk`. On iPad: open in Safari → Share → Add to Home Screen (full-screen), then lock with Settings → Accessibility → Guided Access. Resets after 60s idle.
- **Payment:** collected by staff (table or counter). Orders are stored in D1 (kept 3 days). Razorpay can be added in `app/api/orders`.

## Live panther mascot
The menu banner shows the panther. Without a video it is the graded photo (`public/brand/hero.webp`), animated (breathing, leans toward touch, lunges on tap). For a truly alive panther, add a short looping clip:
1. Footage: a black panther on a **black/very dark background**, 4–8 s, seamless loop, no audio (licensed stock, or AI-generated from your reference photos).
2. Shrink for phones (target under ~1.5 MB):
   `ffmpeg -i in.mp4 -an -vf "scale=720:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart public/mascot/panther.mp4`
3. Admin → Settings → *Mascot video URL* → `/mascot/panther.mp4`. It is blended onto the black UI with `screen`, plays only while on screen, and is paused for reduced-motion users.
