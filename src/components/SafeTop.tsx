"use client";

/**
 * Deckt den Bereich der Statusleiste ab, seit die Seite darunter durchläuft
 * (statusBarStyle "black-translucent" in layout.tsx). iOS zeichnet Uhr,
 * Empfang und Akku dort in Weiß — auf dem weißen globalen Kopf wären sie
 * ohne diesen Petrol-Grund unsichtbar. Auf Geräten ohne Aussparung ist die
 * Höhe 0.
 *
 * Wo der Streifen NICHT gebraucht wird, blendet globals.css ihn aus:
 * unter `body.has-bottom-nav` (eingeloggt am Handy — der Kopf ist dort
 * versteckt, das Petrol-Band der Seite läuft selbst bis unter die Uhr),
 * auf dem Dashboard (`html.dashboard-aktiv`, eigener grüner Kopf) und im
 * Dunkelmodus (`html.dunkel`, dunkler Grund genügt). Auf allen übrigen
 * Seiten — Anmeldefamilie, Impressum, Datenschutz, Fehlerseiten — steht
 * der Kopf oben, bekommt in HeaderClient ein Polster in Höhe der
 * Aussparung, und dieser Streifen liegt genau darauf (Gegenprüfung der
 * Launch-Runde, 05.09.2026). Reine Client-Komponente ohne Zustand: sie ist
 * beim ersten Zeichnen da, nichts blitzt auf.
 */
export default function SafeTop() {
  return <div className="safe-top" aria-hidden="true" />;
}
