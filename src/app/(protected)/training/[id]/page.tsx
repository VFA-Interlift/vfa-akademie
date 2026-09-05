import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppCard from "@/components/ui/AppCard";
import AppButton from "@/components/ui/AppButton";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCertificateKind } from "@/lib/certificates/templates";
import { cleanTrainingTitle, formatInstructorName } from "@/lib/trainings/format";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Diese Seite prüfte bisher nur, dass jemand angemeldet ist — jeder konnte
  // jede Schulung samt Einlöse-Token aufrufen. Jetzt nur die eigenen, Admins
  // ausgenommen.
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!me) redirect("/login");

  if (me.role !== "ADMIN") {
    const eigeneAnmeldung = await prisma.enrollment.findUnique({
      where: { userId_trainingId: { userId: me.id, trainingId: id } },
      select: { id: true },
    });
    if (!eigeneAnmeldung) redirect("/meine-schulungen");
  }

  // Der QR-Block samt Token-Abfrage ist seit der Launch-Runde (05.09.2026)
  // weg: Er zeigte auf eine Route /scan, die es in der App nicht gibt, und
  // erklärte sich mit einem Bau-Hinweis über „Testprozesse".
  const training = await prisma.training.findUnique({ where: { id } });

  if (!training) {
    return (
      <main className="page-main">
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <PageHeader title="Schulung nicht gefunden" />

          <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
            Diese Schulung existiert nicht oder wurde gelöscht.
          </p>

          <AppButton href="/meine-schulungen" variant="primary">
            Zurück zu meinen Schulungen
          </AppButton>
        </div>
      </main>
    );
  }

  const zeitraum =
    training.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    (training.endDate
      ? ` bis ${training.endDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`
      : "");

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title={cleanTrainingTitle(training.title)} />

        <div style={{ display: "grid", gap: 16 }}>
          <AppCard accent="green">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "var(--vfa-gruen-text)",
                    fontSize: "var(--t-gross)",
                    fontWeight: 700,
                    lineHeight: "var(--lh-eng)",
                  }}
                >
                  Schulungsdetails
                </h2>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <StatusBadge variant="yellow">
                    {formatCertificateKind(training.certificateKind)}
                  </StatusBadge>

                  {training.code && (
                    <StatusBadge>Kürzel: {training.code}</StatusBadge>
                  )}

                  <StatusBadge variant="success">
                    {training.creditsAward} Credits
                  </StatusBadge>
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 180 }}>
                <Info label="Zeitraum" value={zeitraum} />
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {training.location && (
                <Info label="Ort" value={training.location} />
              )}

              {(() => {
                const instructorName = formatInstructorName(training.instructor);
                if (instructorName === "Noch nicht hinterlegt") return null;
                return <Info label="Dozent" value={instructorName} />;
              })()}

              <Info
                label="Dokument nach Abschluss"
                value={formatCertificateKind(training.certificateKind)}
              />

              <Info
                label="Credits nach Abschluss"
                value={String(training.creditsAward)}
              />
            </div>

            {training.description && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--vfa-linie)",
                }}
              >
                <div className="etikett" style={{ marginBottom: 6 }}>
                  Inhalte
                </div>

                <div style={{ color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
                  {training.description}
                </div>
              </div>
            )}
          </AppCard>

          <div>
            <AppButton href="/meine-schulungen" variant="secondary">
              Zurück zu meinen Schulungen
            </AppButton>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="etikett" style={{ marginBottom: 4 }}>
        {label}
      </div>

      <div style={{ color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>{value}</div>
    </div>
  );
}
