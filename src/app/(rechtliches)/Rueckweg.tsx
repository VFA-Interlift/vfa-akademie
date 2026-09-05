"use client";

import { createContext, useContext, type ReactNode } from "react";
import PageHeader from "@/components/ui/PageHeader";

/**
 * Rückweg für Impressum und Datenschutz (Launch-Runde 05.09.2026).
 *
 * Das Layout prüft serverseitig die Sitzung und legt hier ab, wohin „Zurück"
 * führt: eingeloggt ins Dashboard, sonst zur Anmeldung. Die Seiten selbst sind
 * Server-Komponenten und können keinen Kontext lesen — deshalb rendert
 * RechtlichesKopf das Petrol-Band und holt sich den Rückweg aus dem Kontext.
 * Ersetzt die frühere feste ZurueckLeiste.
 */
const RueckwegContext = createContext<string>("/login");

export function RueckwegProvider({ href, children }: { href: string; children: ReactNode }) {
  return <RueckwegContext.Provider value={href}>{children}</RueckwegContext.Provider>;
}

export function RechtlichesKopf({ title }: { title: string }) {
  const backHref = useContext(RueckwegContext);
  return <PageHeader title={title} backHref={backHref} backLabel="Zurück" />;
}
