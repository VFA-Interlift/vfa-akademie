import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1a1a1a, #0b0b0b)",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          VFA-Akademie
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.85,
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          Digitale Schulungsnachweise per QR-Code.  
          Teilnahme erfassen. Badges automatisch vergeben.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              background: "#ffffff",
              color: "#000",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Anmelden
          </Link>

          <Link
            href="/register"
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Registrieren
          </Link>
        </div>

        <div
          style={{
            marginTop: 28,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            opacity: 0.7,
            lineHeight: 1.6,
          }}
        >
          <div>✔ QR-Code scannen → Badge wird automatisch erstellt</div>
          <div>✔ Zeitlich begrenzte Tokens pro Schulung</div>
          <div>✔ Jeder Kurs mehrfach pro Jahr möglich (A1-2601, A1-2602, …)</div>
        </div>
      </div>
    </main>
  );
}
