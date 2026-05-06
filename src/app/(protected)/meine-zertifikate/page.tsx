import BackButton from "@/components/BackButton";
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
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <BackButton label="Zurück" />
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
          Meine Zertifikate
        </h1>
      </div>

      <p style={{ color: "#aaa", marginBottom: 24 }}>
        Hier findest du deine Teilnahmebestätigungen und Zertifikate aus abgeschlossenen Schulungen.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {certificates.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Aktuell sind noch keine Zertifikate vorhanden.
          </div>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>
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
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {cert.certificateKindLabel}
                </span>

                {cert.code && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Kürzel: {cert.code}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 12, color: "#aaa" }}>
                Schulung: {cert.trainingTitle}
              </div>

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Schulungsdatum: {cert.trainingDate.toLocaleDateString("de-DE")}
                {cert.trainingEndDate
                  ? ` bis ${cert.trainingEndDate.toLocaleDateString("de-DE")}`
                  : ""}
              </div>

              {cert.location && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Ort: {cert.location}
                </div>
              )}

              {cert.instructor && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Dozent: {cert.instructor}
                </div>
              )}

              {cert.description && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Inhalte: {cert.description}
                </div>
              )}

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Ausgestellt am: {cert.issuedAt.toLocaleDateString("de-DE")}
              </div>

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Credits: {cert.credits}
              </div>

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Status: Verfügbar
              </div>

              {cert.pdfUrl && (
                <a
                  href={cert.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    color: "#fff",
                    fontWeight: 800,
                  }}
                >
                  Zertifikat herunterladen →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}