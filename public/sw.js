/*
 * Minimaler Service Worker für die VFA-Akademie-PWA.
 *
 * Zweck: Wer die App auf den Startbildschirm legt und ohne Netz öffnet
 * (Fahrstuhlschacht, Schulungskeller), sah bisher die Browser-Fehlerseite.
 * Jetzt zeigt eine eigene Offline-Seite, und die App-Shell startet wieder,
 * sobald Netz da ist.
 *
 * Bewusst zurückhaltend: kein aggressives Caching von HTML/Daten, damit ein
 * Deploy nie eine veraltete Seite ausliefert. Gecacht wird nur die
 * Offline-Fallback-Seite; alles andere läuft übers Netz (network-only), mit
 * der Offline-Seite als Rückfall für fehlgeschlagene Seitenaufrufe.
 */
const CACHE = "vfa-akademie-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Nur echte Seitenaufrufe abfangen. Alles andere (Daten, Bilder, Skripte)
  // bleibt unangetastet – so kann nichts Veraltetes ausgeliefert werden.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});
