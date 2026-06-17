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
        padding: 22,
        borderRadius: 12,
        border:
          accent === "green"
            ? `1px solid ${VFA_GREEN}`
            : accent === "yellow"
              ? `1px solid ${VFA_YELLOW}`
              : "1px solid #E8E8E8",
        background: "#FFFFFF",
        color: "#1F1F1F",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
