import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppButton from "@/components/ui/AppButton";

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
        <div className="etikett">Seite nicht gefunden</div>

        <h1
          style={{
            margin: "10px 0 12px",
            fontSize: "var(--t-titel)",
            fontWeight: 750,
            color: "var(--vfa-text)",
            letterSpacing: "-0.02em",
            lineHeight: "var(--lh-eng)",
          }}
        >
          Diese Seite gibt es nicht
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "var(--t-basis)",
            lineHeight: "var(--lh-weit)",
            color: "var(--vfa-text-2)",
          }}
        >
          Vielleicht hat sich in der Adresse ein Tippfehler eingeschlichen, oder
          die Seite wurde verschoben.
          {!angemeldet && (
            <>
              {" "}
              Kommst du nicht weiter, schreib uns kurz an{" "}
              <a
                href="mailto:info@vfa-interlift.de"
                style={{ color: "var(--vfa-gruen-text)", fontWeight: 700 }}
              >
                info@vfa-interlift.de
              </a>
              .
            </>
          )}
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
          <AppButton href={angemeldet ? "/dashboard" : "/login"}>
            {angemeldet ? "Zum Dashboard" : "Anmelden"}
          </AppButton>

          {/* Der Anker #feedback setzt voraus, dass die Feedback-Karte unter
              Einstellungen die id trägt (offene Frage an die Werkstatt). */}
          {angemeldet && (
            <AppButton href="/einstellungen#feedback" variant="ghost">
              Problem melden
            </AppButton>
          )}
        </div>
      </div>
    </main>
  );
}
