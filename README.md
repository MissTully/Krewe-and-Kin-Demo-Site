# Krewe of Unicorns — Demo Website

A **Krewe & Kin** marketing demo site. It shows a full, real-feeling krewe website —
public pages *and* a member portal — built on the same feature set as the flagship
Krewe of Shamrock build, but with an original **unicorn / rainbow / magic** theme.

Use it to show prospective krewes what "your own site, your own identity" looks like:
same engine, completely different soul.

**The Krewe of Unicorns is fictional** — invented purely for this demo.

## What's inside (same features as a full krewe build)
- **Home** — hero, about, live-style events list, recruiting
- **Events** — upcoming events + RSVP form · **Parades** · **The Enchanted Ball** (gala)
- **About** — **Unicorn Lore** (interactive lesson library with quizzes & progress),
  **Krewe History**, **Krewe Creativity** (poetry & member art)
- **Media** — Photo Gallery · Videos · Share Yours
- **Get Involved** — Volunteer/Service · Shop · **Members Area** (directory, dues,
  RSVPs, engagement, and more)
- **Join** — membership application
- Floating music player, animated sparkle field, responsive nav, scroll reveals

## Demo data (no backend)
Every dynamic screen is populated with **baked-in sample data** and every form is
**demo-only** — nothing is sent anywhere and there is no database. On a live Krewe & Kin
build these are wired to a real Supabase backend (see the Shamrock build). This keeps the
demo self-contained, instant, and safe to share.

## Structure
- `*.html` — the site pages
- `assets/krewe.css`, `assets/krewe.js` — shared theme + behavior
- `assets/img/` — the original SVG crest, star/rainbow ornaments, and generated
  aurora "scene" SVGs
- `assets/img/photos/` — web-optimized unicorn artwork used across the site
  (hero, page headers, gallery, features); full-resolution source files live in
  `source-images/` and are excluded from the deploy
- `assets/audio/krewe-theme.wav` — the krewe's theme tune

## Running locally
Open `index.html` in a browser, or serve the folder with any static server:
```
python3 -m http.server   # then visit http://localhost:8000
```
No build step — the pages are served as-is.

## Deploying to Vercel
This repo is a static site — import it into Vercel (no framework preset needed) and it
deploys at the domain root; every push to `main` redeploys automatically.

## Notes
- The raw AI-generated source artwork is not stored here; the web-optimized copies the site
  uses live in `assets/img/photos/`.

---
Built with 🦄 by Krewe & Kin.
