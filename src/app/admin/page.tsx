import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (me?.role !== "ADMIN") redirect("/dashboard");

  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  };

  const subStyle: React.CSSProperties = {
    fontWeight: 400,
    color: "#aaa",
    marginTop: 6,
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Admin</h1>
      <p style={{ color: "#aaa", marginBottom: 18 }}>Was möchtest du machen?</p>

      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/admin/trainings" style={cardStyle}>
          Schulung erstellen / Trainings verwalten →
          <div style={subStyle}>Trainings anlegen, creditsAward setzen, manuell vergeben</div>
        </Link>

        <Link href="/admin/users" style={cardStyle}>
          Admin ernennen →
          <div style={subStyle}>User per E-Mail zum Admin machen</div>
        </Link>
      </div>
    </main>
  );
}
