"use client";

import { usePathname } from "next/navigation";

/**
 * Deckt den Bereich der Statusleiste ab, seit die Seite darunter durchläuft
 * (statusBarStyle "black-translucent" in layout.tsx). iOS zeichnet Uhr,
 * Empfang und Akku dort in Weiß — auf hellen Seiten ohne eigenen dunklen
 * Kopf wären sie ohne diesen Petrol-Grund unsichtbar. Auf Geräten ohne
 * Aussparung ist die Höhe 0.
 *
 * Seit der Launch-Runde (05.09.2026) trägt jede Seite außer dem Dashboard
 * das Petrol-Band aus PageHeader, und das Dashboard hat seinen eigenen
 * grünen Kopf — beide reichen bis unter die Statusleiste und geben der Uhr
 * selbst den Grund. Ein Deckstreifen darüber ergäbe wieder die bekannte
 * Naht (plain Petrol über bewegtem Muster). Die Liste ist deshalb zur
 * Ausnahmeliste geworden: Nur was hier steht, bekommt den Streifen noch.
 * Sie ist leer; die Komponente bleibt, falls eine Seite ohne Band
 * dazukommt. usePathname wirkt schon beim Server-Rendern, es gibt also
 * keinen Augenblick beim Laden, in dem der Streifen kurz zu sehen wäre.
 */
const MIT_STREIFEN: string[] = [];

export default function SafeTop() {
  const pfad = usePathname();

  const streifenSeite = MIT_STREIFEN.some((p) => pfad === p || pfad.startsWith(p + "/"));

  if (!streifenSeite) {
    return null;
  }

  return <div className="safe-top" aria-hidden="true" />;
}
