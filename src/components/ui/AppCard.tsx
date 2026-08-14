type AppCardProps = {
  children: React.ReactNode;
  as?: "div" | "section" | "article";
  style?: React.CSSProperties;
  accent?: "none" | "yellow" | "green";
};

const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";

export default function AppCard({
  children,
  as = "div",
  style,
  // Standard neutral: Wenn jede Karte einen gelben Rahmen trägt, hebt Gelb
  // nichts mehr hervor. Gelb bleibt für die eine Karte je Seite, die
  // Aufmerksamkeit verdient (accent="yellow" dort ausdrücklich setzen).
  accent = "none",
}: AppCardProps) {
  const Component = as;

  return (
    <Component
      style={{
        position: "relative",
        padding: 18,
        borderRadius: 14,
        border:
          accent === "green"
            ? `1px solid ${VFA_GREEN}`
            : accent === "yellow"
              ? `1px solid ${VFA_YELLOW}`
              : "1px solid var(--vfa-linie)",
        background: "var(--vfa-karte)",
        color: "var(--vfa-text)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
