type AppInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password" | "number";
  disabled?: boolean;
};

export default function AppInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
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
          opacity: disabled ? 0.7 : 1,
          transition: "border-color 120ms ease",
        }}
      />
    </label>
  );
}
