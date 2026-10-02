// Offline support: precache the app shell, then cache tiles/icons/libs as they are used
const CACHE = "siem-reap-pwa-v5";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css",
  "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(SHELL.map((u) => c.add(new Request(u, { mode: u.startsWith("http") ? "no-cors" : "same-origin" })).catch(() => {}))),
    ),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Never cache live routing calls
  if (req.method !== "GET" || (req.url.includes("router.project-osrm.org") || req.url.includes("routing.openstreetmap.de") || /allorigins|corsproxy|codetabs|workers\.dev/.test(req.url))) return;
  // Cache-first (stale-while-revalidate) so it works with no signal
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});