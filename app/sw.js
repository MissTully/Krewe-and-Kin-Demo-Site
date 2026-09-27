/* ============================================================
   Krewe of Unicorns member app: service worker
   - Pre-caches the app shell so the app opens offline.
   - Serves same-origin files cache-first, refreshing in the background.
   - Shows notifications sent from the page (demo alerts).
   Bump CACHE_VERSION whenever you change any file listed in SHELL,
   so installed phones pick up the new version.
   ============================================================ */

const CACHE_VERSION = "kou-app-v1";

const IMAGES = [
  "parade-20", "parade-17", "parade-04", "parade-13", "parade-26", "unicorn-cosmic",
  "unicorn-forest", "parade-18", "rainbow-run", "parade-16", "parade-02", "parade-06",
  "parade-11", "parade-14", "parade-15", "parade-21", "parade-23", "parade-27",
  "trio-ornate", "rainbow-prance", "parade-19", "parade-24"
].map((name) => `img/${name}.jpg`);

const SHELL = [
  "./",
  "index.html",
  "app.css",
  "data.js",
  "app.js",
  "vendor/qrcode.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/badge-96.png",
  ...IMAGES
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // allSettled: one missing file must not stop the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Google Fonts: cache them the first time so text looks right offline.
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isFont) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);
      if (cached) return cached;
      const fresh = await network;
      if (fresh) return fresh;
      // Offline and never cached: fall back to the app shell for page navigations.
      if (request.mode === "navigate") return cache.match("index.html");
      return new Response("", { status: 504, statusText: "Offline" });
    })
  );
});

// The page posts { type: "notify", title, body, tag } to show a demo notification.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "notify") {
    self.registration.showNotification(data.title || "Krewe of Unicorns", {
      body: data.body || "",
      tag: data.tag || "kou-demo",
      icon: "icons/icon-192.png",
      badge: "icons/badge-96.png",
      data: { url: data.url || "./index.html#home" }
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./index.html", self.location.href).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if ("focus" in win) { win.navigate(target); return win.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});
