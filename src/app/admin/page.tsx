"use client";

import { useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function AdminMenuPage() {
  const [trainingOpen, setTrainingOpen] = useState(false);

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

  const buttonStyle: React.CSSProperties = {
    ...cardStyle,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  };

  const subStyle: React.CSSProperties = {
    fontWeight: 400,
    color: "#aaa",
    marginTop: 6,
  };

  const dropdownStyle: React.CSSProperties = {
    display: "grid",
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.025)",
  };

  const itemStyle: React.CSSProperties = {
    display: "block",
    padding: 14,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  };

  const itemSubStyle: React.CSSProperties = {
    fontWeight: 400,
    color: "#aaa",
    marginTop: 4,
    fontSize: 14,
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <BackButton label="Zurück" />
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
          Admin-Bereich
        </h1>
      </div>

      <p style={{ color: "#aaa", marginTop: 14, marginBottom: 18 }}>
        Was möchtest du verwalten?
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <button
            type="button"
            onClick={() => setTrainingOpen((value) => !value)}
            style={buttonStyle}
          >
            Schulung verwalten {trainingOpen ? "▲" : "▼"}
            <div style={subStyle}>
              Schulungen erstellen, bearbeiten und Teilnehmer verwalten
            </div>
          </button>

          {trainingOpen && (
            <div style={dropdownStyle}>
              <Link href="/admin/trainings" style={itemStyle}>
                Schulung erstellen / verwalten
                <div style={itemSubStyle}>
                  Schulungen anlegen, Zeitraum, Ort, Dozent und Credits festlegen
                </div>
              </Link>

              <Link href="/admin/trainings/add" style={itemStyle}>
                Teilnehmer verwalten
                <div style={itemSubStyle}>
                  Teilnehmer einer Schulung zuordnen oder Zuordnung entfernen
                </div>
              </Link>
            </div>
          )}
        </div>

        <Link href="/admin/credits" style={cardStyle}>
          Credits verwalten →
          <div style={subStyle}>
            Credits manuell vergeben oder abziehen
          </div>
        </Link>

        <Link href="/admin/users" style={cardStyle}>
          Admin verwalten →
          <div style={subStyle}>
            User per E-Mail zum Admin machen
          </div>
        </Link>
      </div>
    </main>
  );
}