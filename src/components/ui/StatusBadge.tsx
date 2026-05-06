type StatusBadgeVariant = "default" | "success" | "warning" | "danger" | "yellow";

type StatusBadgeProps = {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
};

export default function StatusBadge({
  children,
  variant = "default",
}: StatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        border: getBorder(variant),
        background: getBackground(variant),
        color: getColor(variant),
        fontSize: 13,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function getBackground(variant: StatusBadgeVariant) {
  if (variant === "success") return "#007873";
  if (variant === "warning") return "rgba(255,193,0,0.25)";
  if (variant === "yellow") return "#FFC100";
  if (variant === "danger") return "rgba(176,0,32,0.10)";

  return "#EFEFEF";
}

function getBorder(variant: StatusBadgeVariant) {
  if (variant === "success") return "1px solid #007873";
  if (variant === "warning") return "1px solid #FFC100";
  if (variant === "yellow") return "1px solid #FFC100";
  if (variant === "danger") return "1px solid rgba(176,0,32,0.28)";

  return "1px solid #C7C7C7";
}

function getColor(variant: StatusBadgeVariant) {
  if (variant === "success") return "#FFFFFF";
  if (variant === "danger") return "#B00020";

  return "#1F1F1F";
}