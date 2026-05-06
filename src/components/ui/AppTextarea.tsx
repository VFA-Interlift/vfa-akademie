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
    <label style={{ display: "grid", gap: 7 }}>
      <span
        style={{
          color: "#333333",
          fontSize: 14,
          fontWeight: 700,
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
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 0,
          border: "1px solid #C7C7C7",
          background: "#FFFFFF",
          color: "#1F1F1F",
          fontSize: 15,
          resize: "vertical",
          fontFamily: "inherit",
          opacity: disabled ? 0.6 : 1,
          outlineColor: "#007873",
        }}
      />
    </label>
  );
}