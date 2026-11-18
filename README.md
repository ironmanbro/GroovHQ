# GROOV HQ — Digital Menu

Next.js 15 · Tailwind · Framer Motion. Mobile-first QR menu with cinematic intro, cart (demo), and protected admin.

## Run
```bash
npm install
ADMIN_PASSWORD=choose-a-strong-one npm run build && ADMIN_PASSWORD=choose-a-strong-one npm start
```
Dev (`npm run dev`) uses admin password `groov-admin` if none is set. In production, admin is **disabled** unless `ADMIN_PASSWORD` is set. Optionally set `ADMIN_SECRET` (cookie signing key).

## Brand assets
- **Logo:** official logo at `public/brand/logo.png` (silver on transparent, extracted from the supplied artwork); Devanagari mark at `public/brand/logo-hindi.png`. It is shown unaltered everywhere.
- **Intro panther:** uses two of the supplied leopard reference shots, graded into a black panther (`public/brand/intro-1.webp`, `intro-2.webp`). For a video version, drop a licensed, optimised clip (H.264 MP4, ~1–2 MB, 720p, ≤4 s) in `public/intro/` and set `settings.introVideo` (e.g. `/intro/panther.mp4`).

## Menu data
All content lives in `data/menu.json` (categories, items, prices, photos, tax, ordering flags). Edit via `/admin` or by hand.
Photos are Unsplash placeholders; upload real ones in `/admin` (stored in `data/uploads`, served at `/media/...`).

## QR codes
Encode `https://YOUR-DOMAIN/?table=12` per table. Table number shows in the header and basket. `?intro=0` skips the intro.

## Hosting
Needs a Node host with a persistent disk for admin edits (Railway, Render, Fly.io, a VPS). On Vercel/Netlify the menu works but admin saves fail (read-only filesystem) — swap `lib/menu.ts` and the upload route for a database/storage (e.g. Supabase); no UI changes needed.

Ordering is a **demo**: nothing is sent to the kitchen; the basket says so.

## Orders, kitchen and kiosk
- **Table ordering:** customers scan `https://YOUR-DOMAIN/?table=N`, order, and follow progress at `/order/<id>` (Received → Preparing → Ready). Prices are recomputed on the server.
- **Kitchen screen:** `/kitchen` (admin password). New orders appear within ~3s; enable sound once per device.
- **Kiosk:** `/kiosk`. On iPad: open in Safari → Share → Add to Home Screen (full-screen), then lock with Settings → Accessibility → Guided Access. Resets after 60s idle.
- **Payment:** collected by staff (table or counter). Orders are stored in `data/orders.json`; needs a host with a persistent disk, or move `lib/orders.ts` to a database. Razorpay can be added in `app/api/orders`.
