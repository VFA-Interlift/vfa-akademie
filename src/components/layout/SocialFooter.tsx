export default function SocialFooter() {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "18px 24px 22px",
        borderTop: "1px solid #E6E6E6",
        background: "#F7F7F4",
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
          color: "#555555",
          fontSize: 13,
        }}
      >
        <a
          href="https://www.linkedin.com/company/vfa-interlift-e-v/?originalSubdomain=de"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#007873",
            fontWeight: 800,
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
            color: "#007873",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Instagram
        </a>
      </div>
    </footer>
  );
}