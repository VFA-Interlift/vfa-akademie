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
};

const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";
const VFA_GREY = "#C7C7C7";

export default function AppButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  fullWidth = false,
}: AppButtonProps) {
  const style = getButtonStyle(variant, disabled, fullWidth);

  if (href) {
    return (
      <Link href={href} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}>
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
    padding: "11px 22px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "opacity 120ms ease, transform 120ms ease, background 120ms ease",
    whiteSpace: "nowrap",
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
      background: "#EFEFEF",
      color: "#1F1F1F",
      border: "1px solid #E0E0E0",
    };
  }

  if (variant === "danger") {
    return {
      ...base,
      background: "rgba(176,0,32,0.10)",
      color: "#B00020",
      border: "1px solid rgba(176,0,32,0.28)",
    };
  }

  return {
    ...base,
    background: "transparent",
    color: VFA_GREEN,
    border: `1px solid ${VFA_GREY}`,
  };
}