import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "48px 24px",
        color: "#1F1F1F",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 28,
            alignItems: "center",
            minHeight: "calc(100vh - 160px)",
          }}
        >
          <div>
            <div
              style={{
                width: 70,
                height: 6,
                background: "#FFC100",
                marginBottom: 22,
              }}
            />

            <img
              src="/logo.png"
              alt="VFA Logo"
              style={{
                width: 96,
                height: 96,
                objectFit: "contain",
                marginBottom: 22,
              }}
            />

            <h1
              style={{
                fontSize: 52,
                fontWeight: 400,
                margin: 0,
                color: "#007873",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.05,
              }}
            >
              VFA-Akademie
            </h1>

            <p
              style={{
                fontSize: 19,
                color: "#333333",
                lineHeight: 1.65,
                marginTop: 20,
                marginBottom: 30,
                maxWidth: 680,
              }}
            >
              Die digitale Plattform für Schulungen, Teilnehmerverwaltung,
              Teilnahmebestätigungen, Zertifikate und Credits der VFA-Akademie.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/login" style={primaryButtonStyle}>
                Anmelden
              </Link>

              <Link href="/register" style={yellowButtonStyle}>
                Registrieren
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #FFC100",
              padding: 28,
              boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 28,
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Akademie digital verwalten
            </h2>

            <p
              style={{
                marginTop: 12,
                marginBottom: 24,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Schulungen werden zentral gepflegt. Nach Abschluss entstehen
              automatisch die passenden Nachweise und Credits.
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              <Feature
                title="Schulungen"
                text="Termine, Teilnehmer, Orte, Dozenten und Inhalte zentral verwalten."
              />

              <Feature
                title="Zertifikate"
                text="Teilnahmebestätigungen und Zertifikate nach Schulungsende automatisch bereitstellen."
              />

              <Feature
                title="Credits"
                text="Credits werden nachvollziehbar vergeben und im Nutzerprofil angezeigt."
              />

              <Feature
                title="Cobra vorbereitet"
                text="Die Struktur ist für eine spätere Synchronisation mit Cobra vorbereitet."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        paddingTop: 14,
        borderTop: "1px solid #E6E6E6",
      }}
    >
      <div
        style={{
          color: "#007873",
          fontWeight: 800,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#333333",
          lineHeight: 1.55,
        }}
      >
        {text}
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
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
};

const yellowButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#FFC100",
  color: "#1F1F1F",
};