# Aaj Kya Banaye — visitor count & like button setup

Your existing page needed a *shared* place to store the visitor count and like
count — something both the Claude artifact sandbox and a static Vercel site
don't have built in. This folder adds that using **Upstash Redis** (free tier)
plus two small serverless functions Vercel runs automatically.

## What's in this folder
```
index.html      <- your meal planner page, updated to call /api/visit and /api/like
manifest.json   <- makes the app installable, with your app name/icon/colors
sw.js           <- minimal service worker (offline caching + installability)
icons/          <- app icons at all required sizes (192, 512, maskable, Apple)
api/visit.js    <- serverless function: increments/reads the visitor counter
api/like.js     <- serverless function: increments/decrements/reads the like counter
```
Vercel automatically turns anything inside `/api` into a serverless function —
no extra config needed. `manifest.json`, `sw.js`, and `icons/` just need to sit
at the root of your deployed site (they already do, in this folder) — nothing
extra to configure there either.

## "Add to Home Screen" — what your users will see
Once this is deployed, the site is installable like a real app:

- **Android / Chrome**: visiting the site shows an automatic "Install app"
  banner/prompt. Tapping it adds a home-screen icon with your logo and the
  name "Aaj Kya Banaye" — opens full-screen, no browser address bar.
- **iPhone / Safari**: Apple doesn't allow automatic install prompts, so users
  need to tap the **Share** icon → **Add to Home Screen**. After that it
  behaves the same way — proper icon, proper name, full-screen.
- Once installed, it also works offline for anything already loaded (the
  service worker caches the app shell), though a live plan generation still
  needs a connection for the visitor/like counters.

If you want to point people to this without them having to find the button
themselves, worth adding one line on the page itself later (e.g. "📲 Add this
to your home screen" with a short how-to) — happy to build that banner if useful.

## One-time setup (about 5 minutes)

### 1. Create a free Upstash Redis database
1. Go to https://upstash.com and sign up (free tier is plenty for this).
2. Click **Create Database**, give it any name, pick a region close to your
   Vercel deployment region.
3. Once created, open the database and find the **REST API** section.
   You'll see two values you need:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Add those two values to your Vercel project
1. In your Vercel dashboard, open this project → **Settings → Environment
   Variables**.
2. Add:
   - `UPSTASH_REDIS_REST_URL` = (the URL from Upstash)
   - `UPSTASH_REDIS_REST_TOKEN` = (the token from Upstash)
3. Apply to all environments (Production, Preview, Development).
4. Redeploy the project (Vercel → Deployments → ⋯ → Redeploy) so the
   functions pick up the new env vars.

### 3. Deploy
If you haven't already:
```
npm i -g vercel     # if you don't have the CLI
cd this-folder
vercel               # follow the prompts
vercel --prod        # when ready to go live
```
Or just push this folder to a GitHub repo and import it in the Vercel
dashboard — either way works, the `/api` folder is picked up automatically.

## How the counting works
- **Visitor count**: on page load, the browser checks a `localStorage` flag
  (`akb_visited`). First visit from that browser → calls `/api/visit` with
  `POST`, which increments the Redis counter. Later visits just `GET` the
  current value without incrementing again.
- **Like button**: same idea with `akb_liked` — clicking toggles like/unlike,
  which calls `/api/like` with `POST` to adjust the shared count, and the
  button remembers your choice for next time via `localStorage`.

## Honest limitations
- This counts **browsers**, not people — clearing localStorage, using
  incognito, or switching devices lets someone "visit" or "like" again.
  That's normal for a lightweight counter like this; if you ever need real
  unique-visitor analytics, you'd want a proper analytics tool (e.g. Vercel
  Analytics, Plausible) instead.
- If the Upstash env vars are missing or the API call fails for any reason,
  the counters just show "—" instead of breaking the page — nothing else on
  the site depends on them.
