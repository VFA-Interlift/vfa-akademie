import { authOptions } from "@/auth";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";

export default async function MeineBadgesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      badges: {
        include: { training: true },
        orderBy: { issuedAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <BackButton />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
          Meine Zertifikate
        </h1>
      </div>

      {user.badges.length === 0 ? (
        <p>Noch keine Zertifikate vorhanden.</p>
      ) : (
        <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
          {user.badges.map((badge) => (
            <li
              key={badge.id}
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: 16,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <strong>{badge.training.title}</strong>
              <div>Datum: {badge.training.date.toLocaleDateString("de-DE")}</div>
              <div>
                Ausgestellt am: {badge.issuedAt.toLocaleDateString("de-DE")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
