import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AnimatedSection from "@/components/ui/AnimatedSection";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [userCount, trainingCount, certCount, enrollmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.training.count(),
    prisma.certificate.count({ where: { status: "ISSUED" } }),
    prisma.enrollment.count({ where: { status: { in: ["CONFIRMED", "ATTENDED"] } } }),
  ]);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        <AnimatedSection delayMs={0}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ width: 40, height: 4, background: "#FFC100", borderRadius: 999, marginBottom: 14 }} />
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 800, color: "#1F1F1F", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Adminbereich
            </h1>
            <p style={{ margin: "8px 0 0", color: "#888888", fontSize: 15 }}>
              Zentrale Verwaltung der VFA-Akademie.
            </p>
          </div>
        </AnimatedSection>

        {/* Stats row */}
        <AnimatedSection delayMs={60}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 28 }}>
            <StatCard label="Nutzer" value={userCount} />
            <StatCard label="Schulungen" value={trainingCount} />
            <StatCard label="Anmeldungen" value={enrollmentCount} />
            <StatCard label="Zertifikate" value={certCount} />
          </div>
        </AnimatedSection>

        {/* Section: Nutzer */}
        <AnimatedSection delayMs={100}>
          <SectionLabel>Nutzer & Credits</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            <AdminTile
              href="/admin/users"
              abbr="NZ"
              title="Nutzer verwalten"
              description="Profile prüfen, Credits bearbeiten, Rollen vergeben, Nutzer löschen."
              color="#007873"
            />
            <AdminTile
              href="/admin/credits"
              abbr="CR"
              title="Credits manuell"
              description="Credits schnell per E-Mail-Adresse anpassen ohne Nutzerliste zu öffnen."
              color="#007873"
            />
          </div>
        </AnimatedSection>

        {/* Section: Schulungen */}
        <AnimatedSection delayMs={140}>
          <SectionLabel>Schulungen & Zertifikate</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            <AdminTile
              href="/admin/trainings"
              abbr="SG"
              title="Schulungen"
              description="Schulungen anlegen, bearbeiten, Teilnehmer aus Cobra importieren."
              color="#007873"
            />
            <AdminTile
              href="/admin/certificates"
              abbr="ZE"
              title="Zertifikate"
              description="Zertifikate für abgeschlossene Schulungen erstellen und Credits vergeben."
              color="#C79A16"
            />
          </div>
        </AnimatedSection>

        {/* Section: System */}
        <AnimatedSection delayMs={180}>
          <SectionLabel>System</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <AdminTile
              href="/admin/cobra"
              abbr="CB"
              title="Cobra/WebConnect"
              description="Verbindungsstatus prüfen, Schulungen und Teilnehmer aus Cobra synchronisieren."
              color="#5A6472"
            />
          </div>
        </AnimatedSection>

      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "14px 16px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: 12 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#007873", lineHeight: 1 }}>
        {value.toLocaleString("de-DE")}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888888", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function AdminTile({ href, abbr, title, description, color }: {
  href: string; abbr: string; title: string; description: string; color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        padding: "18px 20px",
        background: "#FFFFFF",
        border: "1px solid #EFEFEF",
        borderRadius: 14,
        display: "grid",
        gap: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color, letterSpacing: "0.04em", flexShrink: 0,
          }}>
            {abbr}
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: "-0.01em" }}>{title}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#666666", lineHeight: 1.55 }}>{description}</p>
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.04em" }}>Öffnen →</span>
      </div>
    </Link>
  );
}
