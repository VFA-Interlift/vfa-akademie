import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email;

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  const isAdmin = me?.role === "ADMIN";

  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  };

  const subStyle: React.CSSProperties = {
    fontWeight: 400,
    color: "#aaa",
    marginTop: 6,
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Menü</h1>

      <p style={{ color: "#aaa", marginBottom: 18 }}>
        Was möchtest du machen?
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/meine-schulungen" style={cardStyle}>
          Meine Schulungen
          <div style={subStyle}>
            Alle Schulungen ansehen, die dir zugeordnet sind
          </div>
        </Link>

        <Link href="/meine-zertifikate" style={cardStyle}>
          Meine Zertifikate
          <div style={subStyle}>
            Übersicht über deine ausgestellten Zertifikate und Nachweise
          </div>
        </Link>

        <Link href="/kurskalender" style={cardStyle}>
          Kurskalender
          <div style={subStyle}>
            Alle verfügbaren Schulungen und Termine ansehen
          </div>
        </Link>

        <Link href="/meine-daten" style={cardStyle}>
          Meine Daten
          <div style={subStyle}>Profil und Angaben bearbeiten</div>
        </Link>

        <a
          href="https://www.vfa-interlift.de/schulungen"
          target="_blank"
          rel="noopener noreferrer"
          style={cardStyle}
        >
          Schulungen (Website)
          <div style={subStyle}>
            Öffnet die Website in einem neuen Tab
          </div>
        </a>

        {isAdmin && (
          <Link href="/admin" style={cardStyle}>
            Admin
            <div style={subStyle}>
              Trainings verwalten, Vergaben und Credits steuern
            </div>
          </Link>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <LogoutButton />
      </div>
    </main>
  );
}