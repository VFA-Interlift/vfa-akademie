import { ReactNode } from "react";
import Link from "next/link";

// Ohne Sitzungs-Check (der Rückweg im Band ist seit dem 05.09.2026 abends
// weg) können beide Seiten wieder statisch vorgerendert werden.
export const dynamic = "force-static";

/**
 * Rahmen für Impressum und Datenschutzerklärung. Bewusst ohne Anmeldezwang:
 * beide müssen ohne Konto erreichbar sein. Den Kopf (Petrol-Band) rendert
 * jede Seite selbst über RechtlichesKopf.
 */
export default function RechtlichesLayout({ children }: { children: ReactNode }) {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {children}

        <div
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid var(--vfa-linie)",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: "var(--t-klein)",
          }}
        >
          <Link href="/impressum" style={{ color: "var(--vfa-gruen-text)", fontWeight: 600 }}>
            Impressum
          </Link>
          <Link href="/datenschutz" style={{ color: "var(--vfa-gruen-text)", fontWeight: 600 }}>
            Datenschutz
          </Link>
          {/* „/" leitet um: Angemeldete ins Dashboard, alle anderen zur Anmeldung. */}
          <Link href="/" style={{ color: "var(--vfa-text-2)", fontWeight: 600 }}>
            Zur App
          </Link>
        </div>
      </div>
    </main>
  );
}
