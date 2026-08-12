"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Feste Zurück-Leiste oben auf Seiten ausserhalb des eingeloggten Bereichs
 * (Impressum, Datenschutz). Dort fehlt die untere Navigationsleiste, und der
 * einzige Rückweg stand bisher ganz unten nach dem langen Text — am Handy kam
 * man praktisch nicht zurück.
 *
 * Geht einen Schritt in der Historie zurück; gibt es keine (Seite direkt
 * geöffnet), führt der Fallback zur Startseite.
 */
export default function ZurueckLeiste() {
  const router = useRouter();
  const pathname = usePathname();
  const titel = pathname?.includes("datenschutz")
    ? "Datenschutz"
    : pathname?.includes("impressum")
      ? "Impressum"
      : "Zurück zur App";

  function zurueck() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div
      style={{
        // Fest oben: Der globale Kopf wird für eingeloggte Handy-Nutzer
        // ausgeblendet, deshalb muss diese Leiste selbst ganz oben kleben und
        // über allem liegen (z-index über dem globalen Kopf).
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2001,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        paddingTop: "max(10px, env(safe-area-inset-top))",
        background: "#007873",
        color: "#FFFFFF",
      }}
    >
      <button
        type="button"
        onClick={zurueck}
        aria-label="Zurück"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          padding: "6px 12px 6px 6px",
          border: "none",
          background: "transparent",
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>‹</span> Zurück
      </button>
      <span style={{ fontWeight: 800, fontSize: 15 }}>{titel}</span>
    </div>
  );
}
