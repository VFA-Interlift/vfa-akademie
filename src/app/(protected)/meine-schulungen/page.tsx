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
        Hier siehst du die Schulungen, die dir zugeordnet sind.
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
            Aktuell sind dir noch keine Schulungen zugeordnet.
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
              <div style={{ fontSize: 18, fontWeight: 700 }}>{training.title}</div>

              <div style={{ marginTop: 8, color: "#aaa" }}>
                Datum: {training.date.toLocaleDateString("de-DE")}
              </div>

              <div style={{ marginTop: 6, color: "#aaa" }}>
                Credits: {training.creditsAward}
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