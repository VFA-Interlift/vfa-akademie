import Link from "next/link";

// Nur Token: Die Fußzeile steht unter jeder Seite und war im Dunkelmodus ein
// heller Streifen mit dunkelgrauem Text (Launch-Runde 05.09.2026).
export default function SocialFooter() {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "18px 24px 22px",
        borderTop: "1px solid var(--vfa-linie)",
        background: "var(--vfa-light)",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          color: "var(--vfa-text-2)",
          fontSize: "var(--t-klein)",
        }}
      >
        <a
          href="https://www.linkedin.com/company/vfa-interlift-e-v/"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--vfa-gruen-text)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          LinkedIn
        </a>

        <span aria-hidden="true">·</span>

        <a
          href="https://www.instagram.com/vfaakademie/"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--vfa-gruen-text)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Instagram
        </a>

        <span aria-hidden="true">·</span>

        <Link
          href="/impressum"
          style={{ color: "var(--vfa-text-2)", fontWeight: 700, textDecoration: "none" }}
        >
          Impressum
        </Link>

        <span aria-hidden="true">·</span>

        <Link
          href="/datenschutz"
          style={{ color: "var(--vfa-text-2)", fontWeight: 700, textDecoration: "none" }}
        >
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
