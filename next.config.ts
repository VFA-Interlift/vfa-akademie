import type { NextConfig } from "next";

/**
 * Schutzköpfe für alle Antworten. HSTS setzt Vercel selbst, der Rest fehlte
 * bislang vollständig.
 *
 * Zur CSP: Die Oberfläche arbeitet durchgehend mit style-Attributen und
 * styled-jsx, Next.js selbst braucht 'unsafe-inline' und 'unsafe-eval' für
 * seine Hydratation. Die Regel bleibt deshalb bewusst weit — ihr Zweck hier ist,
 * fremde Quellen auszuschließen (frame-ancestors, form-action, object-src),
 * nicht Inline-Code zu verbieten. Enger wird sie erst, wenn die Seiten auf
 * Klassen statt style-Attribute umgestellt sind.
 */
const SICHERHEITS_HEADER = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // SAMEORIGIN statt DENY: Die Feedback-Auswertung im Adminbereich zeigt das
  // erzeugte PDF in einem eigenen iframe. DENY verbietet auch die Einbettung in
  // die eigene Seite, die Vorschau bliebe leer.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Die Kamera bleibt erlaubt: der Dozentenbereich fotografiert die
    // unterschriebene Teilnehmerliste ab.
    value: "geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      // PdfOverlay zeigt Zertifikate und Feedback-PDFs als iframe mit einer
      // blob:-Adresse (PdfAnsichtLink, CertificateDownloadButton). 'self' aus
      // default-src deckt blob: nicht ab, Chrome ließe das iframe leer (05.09.2026).
      "frame-src 'self' blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.public.blob.vercel-storage.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

// Antworten der API tragen Personenbezug (Profil, Ranking, Credits, Nutzerlisten)
// und bekamen von Vercel „public, max-age=0, must-revalidate" ohne Vary: Cookie.
// Deshalb für alle API-Routen privat und ohne Zwischenspeicher; ausgenommen ist
// nur der ausdrücklich öffentliche Schulungskatalog (05.09.2026).
const API_CACHE_HEADER = [{ key: "Cache-Control", value: "private, no-store" }];

const nextConfig: NextConfig = {
  // Kein „X-Powered-By: Next.js" in den Antworten (05.09.2026).
  poweredByHeader: false,

  // Die Zertifikatsvorlagen liegen nicht mehr unter public/ (dort waren sie
  // öffentlich herunterladbar). Damit Vercel sie trotzdem mit ausliefert,
  // müssen sie hier ausdrücklich benannt werden — sonst findet der
  // Zertifikatsdownload im Betrieb keine Datei.
  outputFileTracingIncludes: {
    // Beide Vorlagenordner: pdf-vorlagen/ für den PDF-Weg, templates/ für die
    // zwei verbliebenen Word-Vorlagen. Fehlte der zweite, liefe der Word-Weg
    // lokal und scheiterte auf Vercel.
    "/api/certificates/**": [
      "./src/lib/certificates/pdf-vorlagen/**",
      "./src/lib/certificates/templates/**",
    ],
  },

  async headers() {
    return [
      { source: "/:path*", headers: SICHERHEITS_HEADER },
      // Alles unter /api außer /api/trainings/public (negativer Vorausblick,
      // mit dem in Next gebündelten path-to-regexp geprüft).
      { source: "/api/:path((?!trainings/public).*)", headers: API_CACHE_HEADER },
    ];
  },
};

export default nextConfig;
