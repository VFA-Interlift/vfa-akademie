import { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RueckwegProvider } from "./Rueckweg";

// Vorher force-static: Seit dem Sitzungs-Check (05.09.2026) muss das Layout
// je Anfrage rendern, sonst kennt es den Rückweg nicht.
export const dynamic = "force-dynamic";

/**
 * Rahmen für Impressum und Datenschutzerklärung. Bewusst ohne Anmeldezwang:
 * beide müssen ohne Konto erreichbar sein. Die Sitzung wird nur geprüft, um
 * den Rückweg im Petrol-Band zu setzen (Dashboard oder Anmeldung) — die feste
 * ZurueckLeiste ist seit der Launch-Runde (05.09.2026) entfallen.
 */
export default async function RechtlichesLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const rueckweg = session?.user?.email ? "/dashboard" : "/login";

  return (
    <RueckwegProvider href={rueckweg}>
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
            <Link href="/" style={{ color: "var(--vfa-text-2)", fontWeight: 600 }}>
              Startseite
            </Link>
          </div>
        </div>
      </main>
    </RueckwegProvider>
  );
}
