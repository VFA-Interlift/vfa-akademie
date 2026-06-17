type AppSelectOption = {
  value: string;
  label: string;
};

type AppSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
};

export default function AppSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Bitte auswählen",
  disabled = false,
}: AppSelectProps) {
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

      <select
        value={value}
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
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
