import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import { fetchWixKurse } from "@/lib/wix/kurse";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [
    userCount,
    certCount,
    enrollmentCount,
    dbTrainingCount,
    feedbackCount,
    websiteAnmeldungen,
    ohneSchulung,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.certificate.count({ where: { status: "ISSUED" } }),
    // Alle Anmeldungen außer stornierten — vorher fiel die Zahl nach jedem
    // Zertifikatslauf, weil CERTIFICATE_ISSUED nicht mitzählte, während die
    // Schulungsseite alle zeigte (Befund f12-7, 05.09.2026).
    prisma.enrollment.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.training.count(),
    prisma.trainingFeedback.count(),
    prisma.cobraTrainingParticipant.count({ where: { participantType: "WIX_WEBSITE" } }),
    // Anmeldungen, deren Kurscode zu keiner Schulung passte. Diese Teilnehmer
    // bekommen weder Einschreibung noch Zertifikat — bisher fiel das niemandem auf.
    prisma.cobraTrainingParticipant.count({
      where: { participantType: "WIX_WEBSITE", trainingId: null },
    }),
  ]);

  // „Schulungen" = Kurse der Website (führende Quelle); DB-Zahl nur als Fallback.
  let trainingCount = dbTrainingCount;
  try {
    trainingCount = (await fetchWixKurse()).length;
  } catch {
    // Website nicht erreichbar → DB-Zahl anzeigen.
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PageHeader title="Adminbereich" />
        <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)" }}>
          Zentrale Verwaltung der VFA-Akademie.
        </p>

        {/* Stats row */}
        <AnimatedSection delayMs={60}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 28 }}>
            <StatCard label="Nutzer" value={userCount} />
            <StatCard label="Schulungen (Website)" value={trainingCount} />
            <StatCard label="Website-Anmeldungen" value={websiteAnmeldungen} />
            <StatCard label="App-Anmeldungen" value={enrollmentCount} />
            <StatCard label="Zertifikate" value={certCount} />
            <StatCard label="Feedback" value={feedbackCount} />
          </div>
        </AnimatedSection>

        {ohneSchulung > 0 ? (
          <AnimatedSection delayMs={80}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "14px 16px",
                marginBottom: 28,
                borderRadius: 12,
                background: "rgba(255,193,0,0.12)",
                border: "1px solid #FFC100",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
                ⚠
              </span>
              <div>
                <strong style={{ display: "block", color: "var(--vfa-text)", fontSize: "var(--t-basis)" }}>
                  {ohneSchulung} Website-{ohneSchulung === 1 ? "Anmeldung" : "Anmeldungen"} ohne
                  Schulungszuordnung
                </strong>
                <span style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", lineHeight: "var(--lh-weit)" }}>
                  Der Kurscode der Anmeldung passt zu keiner Schulung in der App. Diese
                  Teilnehmenden erhalten keine Einschreibung, kein Zertifikat und keine Credits.
                  Meist ein abweichender Kurscode auf der Website — unter „Schulungen“ nachsehen.
                </span>
              </div>
            </div>
          </AnimatedSection>
        ) : null}

        {/* Section: Nutzer */}
        <AnimatedSection delayMs={100}>
          <SectionLabel>Nutzer</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            <AdminTile
              href="/admin/users"
              abbr="NZ"
              title="Nutzer verwalten"
              description="Profile prüfen, Credits bearbeiten, Rollen vergeben, Nutzer löschen."
            />
          </div>
        </AnimatedSection>

        {/* Section: Schulungen */}
        <AnimatedSection delayMs={140}>
          <SectionLabel>Schulungen</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            <AdminTile
              href="/admin/schulungen"
              abbr="ST"
              title="Schulungen & Teilnehmer"
              description="Alle Website-Schulungen mit Anmeldungen, Teilnehmern und Anwesenheitsstatus."
            />
            <AdminTile
              href="/admin/website"
              abbr="WS"
              title="Website-Synchronisation"
              description="Schulungen der Website (Wix-CMS) in die App übernehmen – ersetzt den Cobra-Sync."
            />
            <AdminTile
              href="/admin/import"
              abbr="HI"
              title="Historie importieren"
              description="Vergangene Schulungen und Teilnehmer aus den Cobra-Exporten einlesen."
            />
            <AdminTile
              href="/admin/trainings"
              abbr="DB"
              title="Schulungen in der Datenbank"
              description="Alle gespeicherten Schulungen mit Datum, Credits und Herkunft."
            />
            <AdminTile
              href="/admin/credits"
              abbr="CR"
              title="Credits verwalten"
              description="Credits manuell gutschreiben oder abziehen, mit Notiz."
            />
            <AdminTile
              href="/admin/feedback"
              abbr="FB"
              title="Feedback-Auswertung"
              description="Sterne-Durchschnitte je Frage und Schulung, Freitexte und Excel-Export."
            />
          </div>
        </AnimatedSection>

        {/* Section: Testrunde — die Rueckmeldungen hingen bisher allein an der
            Benachrichtigungs-Mail; hier sind sie auch ohne Mail sichtbar
            (Befund 20.08.2026). */}
        <AnimatedSection delayMs={180}>
          <SectionLabel>Testrunde</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            <AdminTile
              href="/admin/app-test"
              abbr="TR"
              title="Testrunde: Rückmeldungen"
              description="Alle eingegangenen Testbogen mit sämtlichen Antworten, direkt aus der Datenbank."
            />
          </div>
        </AnimatedSection>

      </div>
    </main>
  );
}

// Kennzahl nach Kanon: Etikett oben, Zahl darunter (.kennzahl), Karte AppCard
// (Launch-Runde 05.09.2026).
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <AppCard style={{ padding: "14px 16px", boxShadow: "none" }}>
      <div className="etikett" style={{ marginBottom: 4 }}>{label}</div>
      <div className="kennzahl">{value.toLocaleString("de-DE")}</div>
    </AppCard>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="etikett" style={{ marginBottom: 10 }}>
      {children}
    </div>
  );
}

// Eine Kachelfarbe (Petrol) für alle; Titel in Textfarbe, 17/700.
function AdminTile({ href, abbr, title, description }: {
  href: string; abbr: string; title: string; description: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <AppCard style={{ padding: "18px 20px", display: "grid", gap: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(0,120,115,0.10)",
            border: "1px solid rgba(0,120,115,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "var(--t-label)", fontWeight: 800, color: "var(--vfa-gruen-text)", letterSpacing: "0.04em", flexShrink: 0,
          }}>
            {abbr}
          </div>
          <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-text)", letterSpacing: "-0.01em", lineHeight: "var(--lh-eng)" }}>{title}</h2>
        </div>
        <p style={{ margin: 0, fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>{description}</p>
        <span style={{ fontSize: "var(--t-label)", fontWeight: 700, color: "var(--vfa-gruen-text)", letterSpacing: "0.04em" }}>Öffnen →</span>
      </AppCard>
    </Link>
  );
}
