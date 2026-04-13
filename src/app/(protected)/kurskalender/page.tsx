// src/app/kurskalender/page.tsx
"use client";

import Link from "next/link";

type CategoryCard = {
  title: string;
};

export default function KurskalenderPage() {
  const cards: CategoryCard[] = [
    { title: "Aufzugstechnik: VDI- zertifizierte Weiterbildung" },
    { title: "Elektrotechnik im Aufzugbau" },
    { title: "Schwerpunkt-Schulungen" },
    { title: "Praxisschulungen für Monteure" },
  ];

  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 18,
  };

  const subStyle: React.CSSProperties = {
    fontWeight: 400,
    color: "#aaa",
    marginTop: 6,
    fontSize: 14,
  };

  const backStyle: React.CSSProperties = {
    display: "inline-block",
    marginBottom: 20,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#aaa",
    textDecoration: "none",
    fontWeight: 600,
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      {/* Zurück-Button */}
      <Link href="/dashboard" style={backStyle}>
        ← Zurück
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        Kurskalender
      </h1>

      <p style={{ color: "#aaa", marginBottom: 18 }}>
        Hier kommen die öffentlichen Schulungen rein. Erstmal nur das Grundgerüst.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.title} style={cardStyle}>
            {c.title}
            <div style={subStyle}>Inhalte folgen</div>
          </div>
        ))}
      </div>
    </main>
  );
}
