import { ReactNode } from "react";
import Link from "next/link";

export const dynamic = "force-static";

/**
 * Rahmen für Impressum und Datenschutzerklärung. Bewusst ohne Anmeldezwang:
 * beide müssen ohne Konto erreichbar sein.
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
            borderTop: "1px solid #E6E6E6",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: 14,
          }}
        >
          <Link href="/impressum" style={{ color: "#007873", fontWeight: 600 }}>
            Impressum
          </Link>
          <Link href="/datenschutz" style={{ color: "#007873", fontWeight: 600 }}>
            Datenschutz
          </Link>
          <Link href="/" style={{ color: "#666666", fontWeight: 600 }}>
            Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
