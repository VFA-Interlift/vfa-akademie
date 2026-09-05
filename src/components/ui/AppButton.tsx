import Link from "next/link";

type AppButtonVariant = "primary" | "yellow" | "secondary" | "danger" | "ghost";

type AppButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: AppButtonVariant;
  fullWidth?: boolean;
  /** Externer Link (Website, Karte, Kalenderdatei): öffnet in einem neuen Tab.
      Vorher baute jede Seite dafür eine eigene Pille (Launch-Runde 05.09.2026). */
  external?: boolean;
  /** Beschriftung für Screenreader, wenn der Text allein nicht reicht. */
  ariaLabel?: string;
};

const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";

export default function AppButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  fullWidth = false,
  external = false,
  ariaLabel,
}: AppButtonProps) {
  const style = getButtonStyle(variant, disabled, fullWidth);

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style} className="vfa-btn" aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} style={style} className="vfa-btn" aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style} className="vfa-btn" aria-label={ariaLabel}>
      {children}
    </button>
  );
}

function getButtonStyle(
  variant: AppButtonVariant,
  disabled: boolean,
  fullWidth: boolean
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: fullWidth ? "100%" : "fit-content",
    minHeight: 42,
    padding: "10px 22px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    border: "none",
  };

  if (variant === "primary") {
    return {
      ...base,
      background: VFA_GREEN,
      color: "#FFFFFF",
      border: `1px solid ${VFA_GREEN}`,
    };
  }

  if (variant === "yellow") {
    return {
      ...base,
      background: VFA_YELLOW,
      color: "#1F1F1F",
      border: `1px solid ${VFA_YELLOW}`,
    };
  }

  if (variant === "secondary") {
    return {
      ...base,
      background: "var(--vfa-karte-2)",
      color: "var(--vfa-text)",
      border: "1px solid var(--vfa-linie)",
    };
  }

  if (variant === "danger") {
    return {
      ...base,
      background: "rgba(176,0,32,0.08)",
      color: "var(--vfa-rot-text)",
      border: "1px solid rgba(176,0,32,0.24)",
    };
  }

  // ghost: Umriss-Knopf. Token statt Festfarben, damit er im Dunkelmodus
  // lesbar bleibt (Launch-Runde 05.09.2026).
  return {
    ...base,
    background: "transparent",
    color: "var(--vfa-gruen-text)",
    border: "1px solid var(--vfa-grey)",
  };
}
