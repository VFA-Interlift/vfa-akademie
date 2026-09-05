"use client";

import PageHeader from "@/components/ui/PageHeader";

/**
 * Kopf für Impressum und Datenschutz: dasselbe Petrol-Band wie auf jeder
 * anderen Seite. Der Rückweg im Band („← Zurück") ist auf Tobis Ansage vom
 * 05.09.2026 abends entfallen — zurück geht es über das Logo im globalen
 * Kopf (Dashboard bzw. Anmeldung) oder den Browser.
 */
export function RechtlichesKopf({ title }: { title: string }) {
  return <PageHeader title={title} />;
}
