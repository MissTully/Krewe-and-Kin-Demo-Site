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

## Printable business cards
`business-cards.html` is a print-ready sheet for **Avery 5371 / 8371 / 8871 / 28877**
(2″ × 3.5″, 10 cards per US Letter sheet). Open it and hit **Print**.

Three faces, switchable in the on-screen control bar:
- **Front** — the Krewe & Kin mark, full bleed
- **Back** — Missy Tully's contact details plus a QR code to `kreweandkin.com`
- **Single-sided** — mark, contact, and QR all on one face, for when you only
  want to run the sheet through the printer once

There is also an **Ink / Bone** colourway switch. Ink is the full-bleed black card;
Bone prints on the warm paper tone and uses far less toner, which is the safer
choice on perforated Avery stock where a misfeed leaves white slivers at the trim.

In the print dialog: US Letter, scale **100%** (not "Fit to page"), margins **None**,
and **Background graphics on** — without that last one the ink colourway prints white.
Test on plain paper against a blank Avery sheet before committing card stock, and
switch the cut guides off for the real run.

The QR codes are generated as vectors, so they stay crisp at any size:
- `assets/img/qr-kreweandkin.svg` — links to `https://kreweandkin.com` (version 3,
  error correction **H**; prints at 0.72″ on the card, a 0.63 mm module — roughly
  2.5× the ISO/IEC 18004 minimum, so it survives dim light, angles, and toner spread)
- `assets/img/qr-vcard-missy-tully.svg` — a full vCard that drops straight into a
  phone's contacts. It carries far more data (version 11, 61 modules), so print it
  at **1.1″ or larger** or it gets unreliable. Not used on the cards by default.

Fonts for this page are self-hosted in `assets/fonts/` rather than pulled from the
Google Fonts CDN, so the sheet renders identically at the moment you print it.

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
