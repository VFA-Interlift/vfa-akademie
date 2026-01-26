import { authOptions } from "@/auth";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MeineBadgesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      badges: {
        include: {
          training: true,
        },
        orderBy: {
          issuedAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Meine Zertifikate
      </h1>

      {user.badges.length === 0 ? (
        <p>Noch keine Zertifikate vorhanden.</p>
      ) : (
        <ul style={{ display: "grid", gap: 12 }}>
          {user.badges.map((badge) => (
            <li
              key={badge.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <strong>{badge.training.title}</strong>
              <div>Datum: {badge.training.date.toLocaleDateString("de-DE")}</div>
              <div>
                Ausgestellt am:{" "}
                {badge.issuedAt.toLocaleDateString("de-DE")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
