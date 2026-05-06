import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        display: "grid",
        placeItems: "center",
        padding: "40px 24px",
        color: "#1F1F1F",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          background: "#FFFFFF",
          border: "1px solid #FFC100",
          padding: 32,
          boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 6,
            background: "#FFC100",
            marginBottom: 18,
          }}
        />

        <img
          src="/logo.png"
          alt="VFA Logo"
          style={{
            width: 86,
            height: 86,
            objectFit: "contain",
            marginBottom: 18,
          }}
        />

        <h1
          style={{
            fontSize: 44,
            fontWeight: 400,
            margin: 0,
            color: "#007873",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            lineHeight: 1.1,
          }}
        >
          VFA-Akademie
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "#333333",
            lineHeight: 1.6,
            marginTop: 18,
            marginBottom: 28,
            maxWidth: 700,
          }}
        >
          Digitale Verwaltung für Schulungen, Teilnahmebestätigungen,
          Zertifikate und Credits der VFA-Akademie.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "11px 22px",
              borderRadius: 999,
              background: "#007873",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            Anmelden
          </Link>

          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "11px 22px",
              borderRadius: 999,
              background: "#FFC100",
              color: "#1F1F1F",
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            Registrieren
          </Link>
        </div>

        <div
          style={{
            marginTop: 30,
            paddingTop: 20,
            borderTop: "1px solid #E6E6E6",
            display: "grid",
            gap: 8,
            color: "#333333",
            lineHeight: 1.6,
          }}
        >
          <div>✓ Schulungen und Teilnehmer zentral verwalten</div>
          <div>✓ Zertifikate und Teilnahmebestätigungen automatisch erstellen</div>
          <div>✓ Credits erst nach Schulungsabschluss vergeben</div>
          <div>✓ Vorbereitung für spätere Cobra-Anbindung</div>
        </div>
      </div>
    </main>
  );
}