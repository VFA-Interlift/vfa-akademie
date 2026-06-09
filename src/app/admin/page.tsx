import Link from "next/link";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminMenuPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PageHeader
          title="Admin-Bereich"
          description="Zentrale Verwaltungsbereiche der VFA-Akademie App."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <AdminLink
            href="/admin/users"
            title="Nutzer"
            description="Registrierte Nutzer anzeigen, Rollen verwalten und Nutzerprofile prüfen."
            badge="User"
            accent="green"
          />

          <AdminLink
            href="/admin/credits"
            title="Credits"
            description="Creditstände prüfen, manuelle Korrekturen vornehmen und Creditverläufe nachvollziehen."
            badge="Credits"
            accent="yellow"
          />

          <AdminLink
            href="/admin/cobra"
            title="Cobra/WebConnect"
            description="Status der Cobra-Anbindung prüfen und Schulungsdaten aus Cobra/WebConnect kontrollieren."
            badge="Sync"
            accent="green"
          />
        </div>
      </div>
    </main>
  );
}

function AdminLink({
  href,
  title,
  description,
  badge,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
  accent: "green" | "yellow";
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        color: "inherit",
        textDecoration: "none",
        height: "100%",
      }}
    >
      <AppCard accent={accent} style={{ height: "100%" }}>
        <div
          style={{
            minHeight: 170,
            display: "grid",
            alignContent: "space-between",
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 24,
                  fontWeight: 550,
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h2>

              <StatusBadge variant={accent === "yellow" ? "yellow" : "default"}>
                {badge}
              </StatusBadge>
            </div>

            <p
              style={{
                margin: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
          </div>

          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
                padding: "9px 18px",
                borderRadius: 999,
                background: "#007873",
                color: "#FFFFFF",
                fontWeight: 850,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Öffnen →
            </span>
          </div>
        </div>
      </AppCard>
    </Link>
  );
}