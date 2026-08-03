import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Vorher leitete diese Seite stumm auf das Dashboard um. Wer sich vertippt hat,
 * landete ohne Erklärung woanders und meldete als Fehler, was keiner war.
 */
export default async function NotFound() {
  const session = await getServerSession(authOptions);
  const angemeldet = Boolean(session?.user?.email);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#FFC100",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Seite nicht gefunden
        </div>

        <h1
          style={{
            margin: "10px 0 12px",
            fontSize: "clamp(26px, 6vw, 34px)",
            fontWeight: 800,
            color: "#1F1F1F",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Diese Seite gibt es nicht
        </h1>

        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#666666" }}>
          Vielleicht hat sich in der Adresse ein Tippfehler eingeschlichen, oder
          die Seite wurde verschoben.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 28,
          }}
        >
          <Link
            href={angemeldet ? "/dashboard" : "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 46,
              padding: "12px 26px",
              borderRadius: 999,
              background: "#007873",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            {angemeldet ? "Zum Dashboard" : "Zur Startseite"}
          </Link>

          {angemeldet && (
            <Link
              href="/einstellungen"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 46,
                padding: "12px 22px",
                borderRadius: 999,
                background: "transparent",
                color: "#444444",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                border: "1px solid #DEDEDE",
              }}
            >
              Problem melden
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
