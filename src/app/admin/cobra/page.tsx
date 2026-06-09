import Link from "next/link";
import type { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CobraAdminClient from "@/components/admin/CobraAdminClient";
import AnimatedSection from "@/components/ui/AnimatedSection";

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
        <AnimatedSection delayMs={0}>
          <div style={{ marginBottom: 18 }}>
            <Link href="/admin" style={backLinkStyle}>
              ← Zurück
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delayMs={80}>
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
              Cobra/WebConnect
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
              Status der Anbindung zwischen Cobra/WebConnect und der
              VFA-Akademie App. Schulungsdaten werden serverseitig gelesen und
              für die spätere Automatisierung vorbereitet.
            </p>
          </section>
        </AnimatedSection>

        <AnimatedSection delayMs={150}>
          <CobraAdminClient />
        </AnimatedSection>
      </div>
    </main>
  );
}

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 38,
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid #007873",
  color: "#007873",
  background: "#FFFFFF",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};