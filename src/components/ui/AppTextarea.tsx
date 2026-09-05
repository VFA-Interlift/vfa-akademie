type AppTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Zeichengrenze des Feldes — setzen, wenn der Server ohnehin kappt,
      damit nichts still verloren geht (Befund 20.08.2026). */
  maxLength?: number;
};

export default function AppTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  maxLength,
}: AppTextareaProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {/* Exakt die Maße von AppInput (Label 13/600, Feld 11/14, Radius 8, 15px). */}
      <span
        style={{
          color: "var(--vfa-text-2)",
          fontSize: "var(--t-klein)",
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
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="vfa-input"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 14px",
          borderRadius: 8,
          border: "1px solid var(--vfa-linie)",
          background: disabled ? "var(--vfa-karte-2)" : "var(--vfa-karte)",
          color: "var(--vfa-text)",
          fontSize: "var(--t-basis)",
          resize: "vertical",
          fontFamily: "inherit",
          opacity: disabled ? 0.7 : 1,
          transition: "border-color 120ms ease",
        }}
      />
    </label>
  );
}
