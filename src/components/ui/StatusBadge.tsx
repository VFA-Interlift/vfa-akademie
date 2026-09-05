type StatusBadgeVariant = "default" | "success" | "warning" | "danger" | "yellow";

type StatusBadgeProps = {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
};

// Petrol und Gelb als Chip-FLÄCHE bleiben fest (Marke in beiden Modi); alles
// andere Token. Schrift auf Staffelmaß 13/700 (Launch-Runde 05.09.2026).
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
        fontSize: "var(--t-klein)",
        fontWeight: 700,
        lineHeight: "var(--lh-eng)",
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

  return "var(--vfa-karte-2)";
}

function getBorder(variant: StatusBadgeVariant) {
  if (variant === "success") return "1px solid #007873";
  if (variant === "warning") return "1px solid #FFC100";
  if (variant === "yellow") return "1px solid #FFC100";
  if (variant === "danger") return "1px solid rgba(176,0,32,0.28)";

  return "1px solid var(--vfa-linie)";
}

function getColor(variant: StatusBadgeVariant) {
  if (variant === "success") return "#FFFFFF";
  if (variant === "danger") return "var(--vfa-rot-text)";
  // Fest dunkel auf dem fest gelben Grund — die Gelb-Regel des Dark Mode.
  if (variant === "yellow") return "#1F1F1F";

  return "var(--vfa-text)";
}