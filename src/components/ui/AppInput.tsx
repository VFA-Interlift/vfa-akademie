type AppInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password" | "number" | "date";
  disabled?: boolean;
  max?: string;
  min?: string;
};

export default function AppInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  max,
  min,
}: AppInputProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          color: "#444444",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="vfa-input"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 14px",
          borderRadius: 8,
          border: "1px solid #D4D4D4",
          background: disabled ? "#F7F7F4" : "#FFFFFF",
          color: "#1F1F1F",
          fontSize: 15,
          opacity: disabled ? 0.7 : 1,
          transition: "border-color 120ms ease",
          // iOS rendert input[type=date] als natives Control mit fester
          // Eigenbreite, das width/max-width ignoriert und über den Kartenrand
          // ragt. -webkit-appearance:none macht es zur normalen Box.
          ...(type === "date"
            ? { WebkitAppearance: "none", appearance: "none", minWidth: 0, height: 44 }
            : {}),
        }}
      />
    </label>
  );
}
