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
// Bei jeder Änderung an offline.html hochzählen: Die Seite landet nur beim
// Installieren im Cache, und ohne neue sw.js installiert der Browser nichts
// neu (v2 am 05.09.2026: Offline-Seite dunkelmodus-tauglich).
const CACHE = "vfa-akademie-v2";
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

/*
 * Web Push: Erinnerung drei Tage vor einer Schulung (Absender: /api/cron/reminders,
 * DAYS_BEFORE dort).
 * Der Server schickt JSON { titel, text, url }; ohne lesbare Daten zeigen wir
 * einen neutralen Hinweis. iOS zeigt Push nur für Apps, die auf dem
 * Home-Bildschirm liegen und in denen die Erinnerung aktiviert wurde.
 */
self.addEventListener("push", (event) => {
  let inhalt = { titel: "VFA-Akademie", text: "Es gibt Neuigkeiten.", url: "/dashboard" };
  try {
    if (event.data) inhalt = { ...inhalt, ...event.data.json() };
  } catch {
    // Unlesbare Daten: neutraler Hinweis genügt.
  }

  event.waitUntil(
    self.registration.showNotification(inhalt.titel, {
      body: inhalt.text,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: inhalt.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ziel = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenster) => {
      const f = fenster.find((w) => "focus" in w);
      if (!f) return clients.openWindow(ziel);
      return Promise.resolve(f.navigate ? f.navigate(ziel) : null)
        .catch(() => {})
        .then(() => f.focus())
        .catch(() => clients.openWindow(ziel));
    })
  );
});
