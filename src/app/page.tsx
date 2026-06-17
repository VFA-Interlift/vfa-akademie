import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 78px)",
        background: "#F7F7F4",
        display: "flex",
        alignItems: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Hero */}
          <div>
            <div
              style={{
                width: 48,
                height: 4,
                background: "#FFC100",
                borderRadius: 999,
                marginBottom: 28,
              }}
            />

            <img
              src="/logo.png"
              alt="VFA Logo"
              style={{
                width: 80,
                height: 80,
                objectFit: "contain",
                marginBottom: 24,
              }}
            />

            <h1
              style={{
                fontSize: "clamp(36px, 6vw, 56px)",
                fontWeight: 700,
                margin: 0,
                color: "#007873",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              VFA-Akademie
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "#555555",
                lineHeight: 1.65,
                marginTop: 18,
                marginBottom: 32,
                maxWidth: 520,
              }}
            >
              Die digitale Plattform für Schulungen, Zertifikate und Credits der
              VFA-Akademie.
            </p>

            <Link href="/login" style={primaryButtonStyle} className="vfa-btn">
              Zur Anmeldung
            </Link>
          </div>

          {/* Feature card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1px solid #E8E8E8",
              padding: 32,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(0,120,115,0.08)",
                color: "#007873",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Funktionen
            </div>

            <h2
              style={{
                margin: "0 0 20px",
                color: "#1F1F1F",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Akademie digital verwalten
            </h2>

            <div style={{ display: "grid", gap: 16 }}>
              <Feature
                title="Schulungen"
                text="Termine, Teilnehmer, Orte, Dozenten und Inhalte zentral verwalten."
              />
              <Feature
                title="Zertifikate"
                text="Teilnahmebestätigungen und Zertifikate automatisch bereitstellen."
              />
              <Feature
                title="Credits"
                text="Credits werden nachvollziehbar vergeben und im Nutzerprofil angezeigt."
              />
              <Feature
                title="Cobra vorbereitet"
                text="Struktur für eine spätere Synchronisation mit Cobra vorbereitet."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        paddingTop: 16,
        borderTop: "1px solid #F0F0F0",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "#FFC100",
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div>
        <div
          style={{
            color: "#1F1F1F",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div style={{ color: "#666666", fontSize: 14, lineHeight: 1.55 }}>
          {text}
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "12px 28px",
  borderRadius: 999,
  background: "#007873",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: "0.03em",
  textDecoration: "none",
};
