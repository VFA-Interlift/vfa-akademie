import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyCertificates } from "@/lib/certificates/service";

export const dynamic = "force-dynamic";

export default async function MeineZertifikatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const certificates = await getMyCertificates(session.user.email);

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
          title="Meine Zertifikate"
          description="Hier findest du deine Teilnahmebestätigungen und Zertifikate aus abgeschlossenen Schulungen."
        />

        <div style={{ display: "grid", gap: 16 }}>
          {certificates.length === 0 ? (
            <AppCard>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
                Aktuell sind noch keine Zertifikate vorhanden.
              </div>

              <p style={{ marginBottom: 0, color: "#333333", lineHeight: 1.6 }}>
                Sobald eine dir zugeordnete Schulung abgeschlossen ist, wird automatisch
                eine Teilnahmebestätigung oder ein Zertifikat erstellt.
              </p>
            </AppCard>
          ) : (
            certificates.map((cert) => (
              <AppCard key={cert.id}>
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
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        color: "#007873",
                        lineHeight: 1.3,
                      }}
                    >
                      {cert.title}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <StatusBadge variant="success">
                        {cert.certificateKindLabel}
                      </StatusBadge>

                      {cert.code && (
                        <StatusBadge variant="yellow">
                          Kürzel: {cert.code}
                        </StatusBadge>
                      )}

                      <StatusBadge>Verfügbar</StatusBadge>
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
                    <strong>Ausgestellt am</strong>
                    <br />
                    {cert.issuedAt.toLocaleDateString("de-DE")}
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
                  <Info label="Schulung" value={cert.trainingTitle} />

                  <Info
                    label="Schulungsdatum"
                    value={`${cert.trainingDate.toLocaleDateString("de-DE")}${
                      cert.trainingEndDate
                        ? ` bis ${cert.trainingEndDate.toLocaleDateString("de-DE")}`
                        : ""
                    }`}
                  />

                  {cert.location && <Info label="Ort" value={cert.location} />}

                  {cert.instructor && (
                    <Info label="Dozent" value={cert.instructor} />
                  )}

                  <Info label="Credits" value={String(cert.credits)} />
                </div>

                {cert.description && (
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
                      {cert.description}
                    </div>
                  </div>
                )}

                {cert.pdfUrl && (
                  <div style={{ marginTop: 18 }}>
                    <AppButton href={cert.pdfUrl} variant="primary">
                      Zertifikat herunterladen →
                    </AppButton>
                  </div>
                )}
              </AppCard>
            ))
          )}
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