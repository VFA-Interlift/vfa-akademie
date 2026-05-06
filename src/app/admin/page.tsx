"use client";

import { useState } from "react";
import Link from "next/link";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminMenuPage() {
  const [trainingOpen, setTrainingOpen] = useState(true);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title="Admin-Bereich"
          description="Hier verwaltest du Schulungen, Teilnehmer, Zertifikate, Credits und Adminrechte."
        />

        <div style={{ display: "grid", gap: 16 }}>
          <AppCard accent="green">
            <button
              type="button"
              onClick={() => setTrainingOpen((value) => !value)}
              style={{
                width: "100%",
                padding: 0,
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#007873",
                      fontSize: 24,
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    Schulungen verwalten
                  </h2>

                  <p
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      color: "#333333",
                      lineHeight: 1.6,
                      fontSize: 16,
                    }}
                  >
                    Schulungen erstellen, bearbeiten, Teilnehmer zuordnen und
                    Schulungsdaten pflegen.
                  </p>
                </div>

                <StatusBadge variant="yellow">
                  {trainingOpen ? "Offen ▲" : "Öffnen ▼"}
                </StatusBadge>
              </div>
            </button>

            {trainingOpen && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid #E6E6E6",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 14,
                }}
              >
                <AdminLink
                  href="/admin/trainings"
                  title="Schulung erstellen / verwalten"
                  description="Schulungen anlegen, Zeitraum, Ort, Dozent, Kürzel und Credits festlegen."
                />

                <AdminLink
                  href="/admin/trainings/add"
                  title="Teilnehmer verwalten"
                  description="Teilnehmer einer Schulung zuordnen oder bestehende Zuordnungen entfernen."
                />
              </div>
            )}
          </AppCard>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <AdminLink
              href="/admin/certificates"
              title="Zertifikate verwalten"
              description="Zertifikate für abgeschlossene Schulungen erstellen und Credits vergeben."
              badge="Zertifikate"
            />

            <AdminLink
              href="/admin/credits"
              title="Credits verwalten"
              description="Credits manuell vergeben oder abziehen."
              badge="Credits"
            />

            <AdminLink
              href="/admin/users"
              title="Admin verwalten"
              description="User per E-Mail zum Admin machen."
              badge="User"
            />
          </div>
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
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <AppCard accent="yellow" style={{ height: "100%" }}>
        <div
          style={{
            minHeight: 150,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
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
                marginBottom: 10,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 22,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                {title}
              </h2>

              {badge && <StatusBadge>{badge}</StatusBadge>}
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
                fontWeight: 800,
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