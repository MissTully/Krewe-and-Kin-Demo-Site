# Krewe of Unicorns: Member App (sample)

A sample member app for the **Krewe of Unicorns**, a fictional krewe. It is for demos and
sales conversations only. Every member, message, phone number and payment in it is invented,
and nothing is sent to any server.

## What kind of app is this?

This is a **Progressive Web App** (often shortened to "PWA"). A Progressive Web App is a
website that includes two extra files that let a phone treat it like a real app:

| File | What it does |
| --- | --- |
| `manifest.webmanifest` | Gives the phone the app's name, icon, colors and start page. This is what makes "Install" / "Add to Home screen" appear on Android. |
| `sw.js` (the "service worker") | A small script the browser runs in the background. It saves the app's files on the phone so the app opens quickly and still works with no internet. It also shows notifications. |

Once installed, the app opens full screen from its own home-screen icon, with no browser
address bar, just like an app from the Google Play Store. You do not need Android Studio,
a Google Play developer account, or any build step.

## How to install it on an Android phone

1. Deploy the site (it already deploys on Vercel: every push to `main` goes live).
2. On a computer, open `https://<your-site>/app/get.html`. It shows a QR code.
   (Or open `https://<your-site>/app/index.html` directly on the phone.)
3. Scan the QR code with the phone camera. It opens in **Chrome**.
4. Tap **Install** in the purple banner, or tap the **⋮ menu → Add to Home screen / Install app**.
5. The unicorn icon appears on the home screen. Open it and tap **Enter the Herd**.

Note: installing needs a secure `https://` address. It will not install from a plain
`http://` address (except `localhost` on your own computer).

## Features

- **Home** – live countdown to the parade, quick actions, next event with one-tap RSVP,
  officer announcements with ✨ reactions, Sparkle Cup rank, photo strip.
- **Events** – upcoming events, "My RSVPs" and "Volunteer" filters. Each event has Going / Maybe /
  Can't go, a guest counter, **Add to calendar** (downloads a `.ics` calendar file),
  **Invite a friend** (the phone's share sheet), directions, and volunteer shift sign-up.
- **Herd** – Krewe Chat channels (General, Announcements, Parade Crew, Float Builders,
  Rides & Carpools), direct messages, and a searchable member directory with profiles.
  Members "reply" automatically so the chat feels alive during a demo.
- **Parade** – line-up details, a parade-ready checklist with a progress ring,
  a live float tracker preview on a route map, carpool link, emergency contacts and a help button.
- **Me** – digital membership card with a QR check-in code, dues payment flow (demo),
  Sparkle Cup leaderboard and badges, dark/light theme, notifications with a test alert,
  install button, reset demo and sign out.
- Works offline, Android back button closes pop-ups, app shortcuts (long-press the icon:
  Member Card, Events, Chat, Parade).

## Files

```
app/
├── index.html            the app screen (shell) and sign-in screen
├── app.css               all styles (dark and light themes)
├── app.js                all behavior: tabs, RSVPs, chat, tracker, dues...
├── data.js               sample data: events, members, messages (edit this to rebrand)
├── manifest.webmanifest  install information (name, icons, colors)
├── sw.js                 service worker (offline + notifications)
├── get.html              "Get the app" page with a QR code
├── icons/                app icons made from the krewe crest
├── img/                  smaller copies of krewe photos, sized for phones
└── vendor/qrcode.js      QR code generator (MIT license, Kazuhiko Arase)
```

## Customizing it for another krewe

1. Edit `data.js`: krewe name, the signed-in member, events, members, channels, messages.
   Event dates are written as **days from today** (`days: 6`) so the demo never looks out of date.
2. Replace the icons in `icons/` (keep the same file names and sizes: 192×192 and 512×512 pixels).
3. Change colors at the top of `app.css` (the `:root` section).
4. **Important:** after changing any file, increase `CACHE_VERSION` in `sw.js`
   (for example `kou-app-v1` → `kou-app-v2`). Otherwise phones that already installed the app
   keep showing the old saved copy.

## Testing on your computer

From the repository folder run `python3 -m http.server 8000`, then open
`http://localhost:8000/app/index.html`. In Chrome, open Developer Tools (F12), click the
phone icon to preview at phone size, and look at the **Application** tab to inspect the
manifest and service worker.

## Going from demo to a real app

On a live Krewe & Kin build, `data.js` is replaced by a real database with member login
(for example Supabase), payments go through a payment provider (for example Stripe), and
notifications are sent from a server with Web Push. If a Google Play Store listing is ever
wanted, this same Progressive Web App can be wrapped with Google's "Trusted Web Activity"
tool (Bubblewrap) without rewriting it.

## References

- Google, "Progressive Web Apps": https://web.dev/explore/progressive-web-apps
- Mozilla Developer Network, "Making Progressive Web Apps installable": https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Mozilla Developer Network, "Service Worker API": https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Google, "Trusted Web Activity / Bubblewrap" (for a Play Store version): https://developer.chrome.com/docs/android/trusted-web-activity
