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
  accent = "yellow",
}: AppCardProps) {
  const Component = as;

  return (
    <Component
      style={{
        position: "relative",
        padding: 18,
        borderRadius: 0,
        border:
          accent === "green"
            ? `1px solid ${VFA_GREEN}`
            : accent === "yellow"
              ? `1px solid ${VFA_YELLOW}`
              : "1px solid #E6E6E6",
        background: "#FFFFFF",
        color: "#1F1F1F",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </Component>
  );
}