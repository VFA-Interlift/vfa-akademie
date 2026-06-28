"use client";

import { useState } from "react";

const STAR_ACTIVE = "#FFB000";
const STAR_INACTIVE = "#D9D9D4";

type StarRatingProps = {
  value: number; // 0 = noch nicht bewertet
  onChange: (value: number) => void;
  disabled?: boolean;
};

/** 1–5-Sterne-Eingabe, klick- und tastaturbedienbar (Pfeiltasten / 1–5). */
export default function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Bewertung von 1 bis 5 Sternen"
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(Math.min(5, (value || 0) + 1));
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(Math.max(0, (value || 0) - 1));
        } else if (/^[1-5]$/.test(event.key)) {
          event.preventDefault();
          onChange(Number(event.key));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= shown;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? "Stern" : "Sterne"}`}
            disabled={disabled}
            tabIndex={disabled ? -1 : value === star || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => onChange(value === star ? 0 : star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              border: "none",
              background: "transparent",
              padding: 2,
              cursor: disabled ? "default" : "pointer",
              lineHeight: 0,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.56l-5.9 3.1 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z"
                fill={filled ? STAR_ACTIVE : STAR_INACTIVE}
                stroke={filled ? STAR_ACTIVE : "#C7C7C2"}
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}

      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: value ? "#1F1F1F" : "#999999", minWidth: 64 }}>
        {value ? `${value} / 5` : "keine Wahl"}
      </span>
    </div>
  );
}
