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

      <select
        value={value}
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
          opacity: disabled ? 0.6 : 1,
          outlineColor: "#007873",
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