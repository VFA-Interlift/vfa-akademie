import AppCard from "@/components/ui/AppCard";
import AppButton from "@/components/ui/AppButton";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";
import { formatCertificateKind } from "@/lib/certificates/templates";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      tokens: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!training) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F7F4",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <PageHeader
            title="Schulung nicht gefunden"
            description="Diese Schulung existiert nicht oder wurde gelöscht."
          />

          <AppButton href="/meine-schulungen" variant="primary">
            Zurück zu meinen Schulungen
          </AppButton>
        </div>
      </main>
    );
  }

  const claimToken = training.tokens[0];
  const tokenValue = claimToken?.token ?? "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const qrData = `${appUrl}/scan?token=${encodeURIComponent(tokenValue)}`;

  const qrImage = tokenValue
    ? await QRCode.toDataURL(qrData, { width: 280, margin: 1 })
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title={training.title}
          description="Hier findest du die Details zu deiner Schulung. Nach Abschluss wird automatisch die passende Teilnahmebestätigung oder das passende Zertifikat erstellt."
        />

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
                    color: "#007873",
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: 1.3,
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

              <div
                style={{
                  fontSize: 14,
                  color: "#333333",
                  textAlign: "right",
                  minWidth: 180,
                }}
              >
                <strong>Zeitraum</strong>
                <br />
                {training.date.toLocaleDateString("de-DE")}
                {training.endDate
                  ? ` bis ${training.endDate.toLocaleDateString("de-DE")}`
                  : ""}
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

              {training.instructor && (
                <Info label="Dozent" value={training.instructor} />
              )}

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
                  borderTop: "1px solid #E6E6E6",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#007873",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  Inhalte
                </div>

                <div style={{ color: "#333333", lineHeight: 1.6 }}>
                  {training.description}
                </div>
              </div>
            )}
          </AppCard>

          <AppCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: 540 }}>
                <h2
                  style={{
                    margin: 0,
                    color: "#007873",
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  Teilnahme / QR-Code
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#333333",
                    lineHeight: 1.6,
                  }}
                >
                  Dieser QR-Code kann für Übergangs- oder Testprozesse genutzt
                  werden. Die finale Teilnahme- und Zertifikatslogik läuft später
                  automatisch über die Schulungsdaten.
                </p>

                {claimToken?.expiresAt && (
                  <div style={{ marginTop: 14 }}>
                    <StatusBadge>
                      Gültig bis:{" "}
                      {claimToken.expiresAt.toLocaleDateString("de-DE")}
                    </StatusBadge>
                  </div>
                )}
              </div>

              {!qrImage ? (
                <div
                  style={{
                    minWidth: 240,
                    padding: 16,
                    border: "1px solid #E6E6E6",
                    background: "#F7F7F4",
                    color: "#333333",
                  }}
                >
                  Kein QR-Code vorhanden.
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #E6E6E6",
                    padding: 16,
                    background: "#F7F7F4",
                    maxWidth: 330,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#007873",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 10,
                    }}
                  >
                    QR-Code für Teilnehmer
                  </div>

                  <img
                    src={qrImage}
                    alt="QR Code"
                    style={{
                      display: "block",
                      width: 280,
                      height: 280,
                      background: "#FFFFFF",
                      border: "1px solid #E6E6E6",
                    }}
                  />
                </div>
              )}
            </div>
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
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div style={{ color: "#1F1F1F", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}