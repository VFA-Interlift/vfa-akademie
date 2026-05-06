import Link from "next/link";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyTrainings } from "@/lib/trainings/service";

export const dynamic = "force-dynamic";

export default async function MeineSchulungenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const trainings = await getMyTrainings(session.user.email);

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
          title="Meine Schulungen"
          description="Hier siehst du die Schulungen, die dir aktuell zugeordnet sind. Nach Abschluss wird automatisch eine Teilnahmebestätigung oder ein Zertifikat erstellt."
        />

        <div style={{ display: "grid", gap: 16 }}>
          {trainings.length === 0 ? (
            <AppCard>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
                Aktuell sind dir keine aktiven Schulungen zugeordnet.
              </div>

              <p style={{ marginTop: 10, marginBottom: 0, color: "#333333", lineHeight: 1.6 }}>
                Sobald dir eine Schulung zugeordnet wurde, erscheint sie hier.
              </p>
            </AppCard>
          ) : (
            trainings.map((training) => (
              <Link
                key={training.id}
                href={`/training/${training.id}`}
                style={{
                  display: "block",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <AppCard>
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
                        {training.title}
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
                          {formatStatus(training.status)}
                        </StatusBadge>

                        <StatusBadge variant="yellow">
                          Nach Abschluss: {training.certificateKindLabel}
                        </StatusBadge>

                        {training.code && (
                          <StatusBadge>
                            Kürzel: {training.code}
                          </StatusBadge>
                        )}
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

                  <div
                    style={{
                      marginTop: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 38,
                      padding: "9px 18px",
                      borderRadius: 999,
                      background: "#007873",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Details öffnen →
                  </div>
                </AppCard>
              </Link>
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

function formatStatus(status: string) {
  if (status === "PENDING") return "Ausstehend";
  if (status === "CONFIRMED") return "Angemeldet";
  if (status === "ATTENDED") return "Teilgenommen";
  if (status === "COMPLETED") return "Abgeschlossen";
  if (status === "CERTIFICATE_ISSUED") return "Zertifikat erstellt";
  if (status === "CANCELLED") return "Storniert";
  if (status === "NO_SHOW") return "Nicht teilgenommen";

  return status;
}