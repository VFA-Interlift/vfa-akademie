import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-hero">
      <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 56,
            alignItems: "center",
          }}
        >
          {/* Hero */}
          <div className="page-enter">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
              <img
                src="/logo.png"
                alt="VFA Logo"
                style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }}
              />
              <div style={{ width: 1, height: 36, background: "#D8D8D4", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#888888",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  lineHeight: 1.4,
                }}
              >
                Verband für<br />Aufzugstechnik
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 6.5vw, 68px)",
                fontWeight: 800,
                margin: 0,
                color: "#1F1F1F",
                letterSpacing: "-0.03em",
                lineHeight: 1.0,
              }}
            >
              VFA-
              <br />
              <span style={{ color: "#007873" }}>Akademie</span>
            </h1>

            <p
              style={{
                fontSize: 17,
                color: "#666666",
                lineHeight: 1.7,
                marginTop: 20,
                marginBottom: 36,
                maxWidth: 440,
              }}
            >
              Die digitale Plattform für Schulungen, Zertifikate und
              Credits — zentral verwaltet, automatisch ausgestellt.
            </p>

            <div className="hero-ctas">
              <Link href="/login" style={primaryButtonStyle} className="vfa-btn">
                Zur Anmeldung
              </Link>
              <Link href="/register" style={ghostButtonStyle} className="vfa-btn">
                Konto erstellen
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 44,
                paddingTop: 32,
                borderTop: "1px solid #E8E8E4",
                flexWrap: "wrap",
              }}
            >
              {[
                { value: "100%", label: "Digital" },
                { value: "Auto", label: "Zertifikate" },
                { value: "DSGVO", label: "Konform" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#007873",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#999999", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08)",
              border: "1px solid #EBEBEB",
            }}
          >
            {/* Card header */}
            <div
              style={{
                background: "linear-gradient(135deg, #007873 0%, #005f5b 100%)",
                padding: "28px 32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "rgba(255,193,0,0.15)",
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                Funktionen
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                Alles auf einen Blick
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: "28px 32px", display: "grid", gap: 0 }}>
              {[
                {
                  title: "Schulungen",
                  text: "Termine, Teilnehmer, Orte und Dozenten zentral verwalten.",
                  dot: "#007873",
                },
                {
                  title: "Zertifikate",
                  text: "Teilnahmebestätigungen automatisch nach Abschluss bereitstellen.",
                  dot: "#FFC100",
                },
                {
                  title: "Credits & Ranking",
                  text: "Credits nachvollziehbar vergeben und im Profil anzeigen.",
                  dot: "#007873",
                },
                {
                  title: "Cobra vorbereitet",
                  text: "Struktur für Synchronisation mit Cobra/WebConnect vorhanden.",
                  dot: "#FFC100",
                },
              ].map((f, i) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "16px 0",
                    borderTop: i === 0 ? "none" : "1px solid #F2F2F0",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: f.dot,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1F1F1F", marginBottom: 2 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#888888", lineHeight: 1.5 }}>
                      {f.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "12px 28px",
  borderRadius: 999,
  background: "#007873",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: "0.01em",
  textDecoration: "none",
  boxShadow: "0 4px 14px rgba(0,120,115,0.3)",
};

const ghostButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "12px 24px",
  borderRadius: 999,
  background: "transparent",
  color: "#444444",
  fontWeight: 600,
  fontSize: 15,
  letterSpacing: "0.01em",
  textDecoration: "none",
  border: "1px solid #DEDEDE",
};
