type AppTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
};

export default function AppTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}: AppTextareaProps) {
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

      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="vfa-input"
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 8,
          border: "1px solid #D4D4D4",
          background: disabled ? "#F7F7F4" : "#FFFFFF",
          color: "#1F1F1F",
          fontSize: 15,
          resize: "vertical",
          fontFamily: "inherit",
          opacity: disabled ? 0.7 : 1,
          transition: "border-color 120ms ease",
        }}
      />
    </label>
  );
}
