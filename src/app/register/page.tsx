import Link from "next/link";

export default function RegisterPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "32px 18px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "grid",
          gap: 22,
          textAlign: "center",
          justifyItems: "center",
        }}
      >
        <div
          style={{
            width: 70,
            height: 6,
            background: "#FFC100",
          }}
        />

        <img
          src="/logo.png"
          alt="VFA Logo"
          style={{
            width: 92,
            height: 92,
            objectFit: "contain",
          }}
        />

        <h1
          style={{
            margin: 0,
            color: "#007873",
            fontSize: "clamp(32px, 9vw, 48px)",
            fontWeight: 400,
            lineHeight: 1.05,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          Registrierung
        </h1>

        <p
          style={{
            margin: 0,
            color: "#333333",
            fontSize: 17,
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          Die Registrierung für die VFA-Akademie erfolgt ausschließlich über
          unsere Website. Bitte wende dich dort an uns.
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 44,
            padding: "11px 28px",
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
          Zur Anmeldung
        </Link>
      </div>
    </main>
  );
}
