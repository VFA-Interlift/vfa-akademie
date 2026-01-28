import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email;

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (me?.role !== "ADMIN") {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>Admin</h1>
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,80,80,0.35)",
            background: "rgba(255,80,80,0.08)",
          }}
        >
          Keine Berechtigung.
        </div>

        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard" style={{ color: "#fff" }}>
            ← Zurück zum Menü
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Admin</h1>
      <p style={{ color: "#aaa", marginBottom: 18 }}>
        Hier kommen Admin-Funktionen rein (Trainings, manuelle Vergabe, Credits-Korrekturen).
      </p>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        ✅ Du bist als <b>ADMIN</b> eingeloggt ({email})
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {/* Platzhalter-Links – bauen wir als nächstes */}
        <Link
          href="/admin/trainings"
          style={{
            display: "block",
            padding: 16,
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Trainings verwalten →
          <div style={{ fontWeight: 400, color: "#aaa", marginTop: 6 }}>
            Credits pro Schulung, Termine, Übersicht
          </div>
        </Link>

        <Link
          href="/admin/award"
          style={{
            display: "block",
            padding: 16,
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Zertifikat manuell vergeben →
          <div style={{ fontWeight: 400, color: "#aaa", marginTop: 6 }}>
            Badge + Credits per E-Mail und Training vergeben
          </div>
        </Link>
      </div>

      <div style={{ marginTop: 22 }}>
        <Link href="/dashboard" style={{ color: "#fff" }}>
          ← Zurück zum Menü
        </Link>
      </div>
    </main>
  );
}
