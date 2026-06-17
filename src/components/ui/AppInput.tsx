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

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 4,
          border: "1px solid #C7C7C7",
          background: "#FFFFFF",
          color: "#1F1F1F",
          fontSize: 15,
          opacity: disabled ? 0.6 : 1,
          outlineColor: "#007873",
        }}
      />
    </label>
  );
}