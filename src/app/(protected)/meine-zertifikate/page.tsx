import BackButton from "@/components/BackButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MeineZertifikatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  // Platzhalter:
  // Später hier echte Zertifikate aus der App-DB laden
  const certificates: Array<{
    id: string;
    title: string;
    issueDate: string;
    status: string;
  }> = [];

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <BackButton label="Zurück" />
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
          Meine Zertifikate
        </h1>
      </div>

      <p style={{ color: "#aaa", marginBottom: 24 }}>
        Hier findest du deine automatisch erstellten Zertifikate aus abgeschlossenen Schulungen.
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
              <div style={{ fontSize: 18, fontWeight: 700 }}>{cert.title}</div>
              <div style={{ marginTop: 8, color: "#aaa" }}>
                Ausgestellt am: {cert.issueDate}
              </div>
              <div style={{ marginTop: 6, color: "#aaa" }}>
                Status: {cert.status}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}