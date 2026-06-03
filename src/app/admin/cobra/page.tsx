import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CobraAdminClient from "@/components/admin/CobraAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminCobraPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      role: true,
    },
  });

  if (!me || me.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <section style={{ marginBottom: 22 }}>
          <div
            style={{
              width: 58,
              height: 5,
              background: "#FFC100",
              marginBottom: 12,
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "#007873",
              textTransform: "uppercase",
            }}
          >
            Cobra-Testbereich
          </h1>

          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              maxWidth: 780,
              color: "#333333",
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            Hier werden die neuen Cobra-Read-Endpunkte geprüft. Die Ansicht
            liest Schulungen und verknüpfte Teilnehmer aus Cobra, übernimmt aber
            noch keine Daten in die App.
          </p>
        </section>

        <CobraAdminClient />
      </div>
    </main>
  );
}