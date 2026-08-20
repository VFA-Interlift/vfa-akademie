import PageHeader from "@/components/ui/PageHeader";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { prisma } from "@/lib/prisma";
import { APP_TEST_FRAGEN } from "@/lib/app-test/fragen";
import { anzahlTester } from "@/lib/app-test/tester";

export const dynamic = "force-dynamic";

/**
 * Eingegangene Rückmeldungen der Testrunde, direkt aus der Datenbank.
 *
 * Die Benachrichtigungs-Mail war bisher der einzige Weg, auf dem die Antworten
 * jemanden erreichten — schlug sie still fehl, lag die Rückmeldung unsichtbar
 * in der Datenbank (Befund 20.08.2026). Diese Seite liest nur; der
 * Rollen-Schutz kommt wie bei allen Admin-Seiten aus src/app/admin/layout.tsx.
 */
export default async function AdminAppTestPage() {
  const rueckmeldungen = await prisma.appTestFeedback.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, name: true, email: true } },
    },
  });

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <PageHeader
          backHref="/admin"
          backLabel="Adminbereich"
          title="Testrunde: Rückmeldungen"
          showTitle={true}
        />

        <div style={{ display: "grid", gap: 12 }}>
          <AnimatedSection>
            <AppCard>
              <p style={{ margin: 0, color: "#333333", lineHeight: 1.6 }}>
                <strong style={{ color: "#007873" }}>
                  {rueckmeldungen.length} von {anzahlTester()}
                </strong>{" "}
                Testerinnen und Testern haben den Bogen abgeschickt. Jede
                Rückmeldung steht hier vollständig — auch wenn die
                Benachrichtigungs-Mail nicht angekommen sein sollte.
              </p>
            </AppCard>
          </AnimatedSection>

          {rueckmeldungen.length === 0 && (
            <AnimatedSection delayMs={60}>
              <AppCard>
                <p style={{ margin: 0, color: "#333333" }}>
                  Es ist noch keine Rückmeldung eingegangen.
                </p>
              </AppCard>
            </AnimatedSection>
          )}

          {rueckmeldungen.map((r, i) => {
            const name =
              [r.user.firstName, r.user.lastName].filter(Boolean).join(" ").trim() ||
              r.user.name ||
              r.user.email;
            const antworten =
              r.answers && typeof r.answers === "object" && !Array.isArray(r.answers)
                ? (r.answers as Record<string, unknown>)
                : {};

            return (
              <AnimatedSection key={r.id} delayMs={Math.min(60 + i * 40, 300)}>
                <AppCard>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 10,
                        flexWrap: "wrap",
                        borderBottom: "1px solid #EFEFEF",
                        paddingBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1F1F1F" }}>{name}</div>
                        <div style={{ fontSize: 13, color: "#888888" }}>{r.user.email}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#007873" }}>
                          {sterne(r.overallRating)} {r.overallRating} von 5
                        </div>
                        <div style={{ fontSize: 13, color: "#888888" }}>Stand: {datum(r.updatedAt)}</div>
                      </div>
                    </div>

                    {APP_TEST_FRAGEN.map((frage) => {
                      const antwort = formatAntwort(antworten[frage.id]);
                      return (
                        <div key={frage.id} style={{ display: "grid", gap: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#6B6B6B", lineHeight: 1.45 }}>
                            {frage.text}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              lineHeight: 1.55,
                              color: antwort.leer ? "#9AA0A6" : "#1F1F1F",
                              fontStyle: antwort.leer ? "italic" : "normal",
                              // Freitexte so zeigen, wie sie eingetippt wurden —
                              // samt Zeilenumbrüchen.
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {antwort.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </AppCard>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/** Skala als Sterne, z. B. ★★★★☆ bei 4 von 5. */
function sterne(wert: number): string {
  const n = Math.max(0, Math.min(5, wert));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function datum(d: Date): string {
  // Vercel läuft in UTC — ohne feste Zeitzone stünde hier die falsche Uhrzeit.
  return `${d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" })} Uhr`;
}

/**
 * Antwortwert lesbar machen. Die Werte wurden beim Speichern serverseitig
 * geprüft (api/app-test), hier wird nur noch defensiv formatiert.
 */
function formatAntwort(wert: unknown): { text: string; leer: boolean } {
  if (typeof wert === "number") return { text: `${sterne(wert)} (${wert} von 5)`, leer: false };
  if (Array.isArray(wert)) {
    const teile = wert.filter((v): v is string => typeof v === "string");
    if (teile.length > 0) return { text: teile.join(", "), leer: false };
    return { text: "keine Angabe", leer: true };
  }
  if (typeof wert === "string" && wert.trim()) return { text: wert, leer: false };
  return { text: "keine Angabe", leer: true };
}
