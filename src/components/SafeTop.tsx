"use client";

import { usePathname } from "next/navigation";

/**
 * Deckt den Bereich der Statusleiste ab, seit die Seite darunter durchläuft
 * (statusBarStyle "black-translucent" in layout.tsx). iOS zeichnet Uhr,
 * Empfang und Akku dort in Weiß — auf den hellen Seiten wären sie ohne diesen
 * Petrol-Grund unsichtbar. Auf Geräten ohne Aussparung ist die Höhe 0.
 *
 * Auf dem Dashboard entsteht der Streifen GAR NICHT — dort liegt der grüne
 * Kopf selbst unter der Uhr, und beim Scrollen soll nach Tobis Entscheidung
 * vom 13.08.2026 („Weg mit der Uhr") kein Balken über der hellen Fläche
 * stehen. usePathname wirkt schon beim Server-Rendern, es gibt also auch
 * keinen Augenblick beim Laden, in dem er kurz zu sehen wäre.
 */
// Seiten, deren Kopf selbst bis unter die Statusleiste reicht: das Dashboard
// (Parallax-Kopf) und alle Seiten mit dem Streifen-Band aus PageHeader. Dort
// gibt das Band der Uhr den Grund; ein Deckstreifen darüber ergäbe wieder die
// bekannte Naht (plain Petrol über bewegtem Muster). Der Kompetenzpass und
// die Anmeldeseiten haben KEIN Band — dort bleibt der Streifen.
const OHNE_STREIFEN = [
  "/dashboard", "/meine-schulungen", "/meine-zertifikate", "/meine-credits",
  "/meine-daten", "/kurskalender", "/badges", "/leaderboard", "/einstellungen",
  "/feedback", "/training", "/dozent", "/app-test",
];

export default function SafeTop() {
  const pfad = usePathname();

  // Die Admin-STARTSEITE hat kein Band (eigener Kopf) — nur die Unterseiten.
  const bandSeite =
    OHNE_STREIFEN.some((p) => pfad === p || pfad.startsWith(p + "/")) ||
    pfad.startsWith("/admin/");

  if (bandSeite) {
    return null;
  }

  return <div className="safe-top" aria-hidden="true" />;
}
