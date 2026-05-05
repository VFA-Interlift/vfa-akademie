import Link from "next/link";
import BackButton from "@/components/BackButton";
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
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <BackButton label="Zurück" />
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
          Meine Schulungen
        </h1>
      </div>

      <p style={{ color: "#aaa", marginBottom: 24 }}>
        Hier siehst du die Schulungen, die dir aktuell zugeordnet sind.
        Nach Abschluss wird automatisch ein Zertifikat erstellt.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {trainings.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Aktuell sind dir keine aktiven Schulungen zugeordnet.
          </div>
        ) : (
          trainings.map((training) => (
            <Link
              key={training.id}
              href={`/training/${training.id}`}
              style={{
                display: "block",
                padding: 16,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {training.title}
              </div>

              <div style={{ marginTop: 8, color: "#aaa" }}>
                Zeitraum: {training.date.toLocaleDateString("de-DE")}
                {training.endDate
                  ? ` bis ${training.endDate.toLocaleDateString("de-DE")}`
                  : ""}
              </div>

              {training.location && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Ort: {training.location}
                </div>
              )}

              {training.instructor && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Dozent: {training.instructor}
                </div>
              )}

              {training.description && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  Inhalte: {training.description}
                </div>
              )}

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Credits nach Abschluss: {training.creditsAward}
              </div>

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Status: {formatStatus(training.status)}
              </div>

              <div style={{ marginTop: 10, fontWeight: 700 }}>
                Details öffnen →
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
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