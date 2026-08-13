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
export default function SafeTop() {
  const pfad = usePathname();

  if (pfad === "/dashboard" || pfad.startsWith("/dashboard/")) {
    return null;
  }

  return <div className="safe-top" aria-hidden="true" />;
}
