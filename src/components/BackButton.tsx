"use client";

import { useRouter } from "next/navigation";

// Maße wie AppButton (42/14/700, Versalien), Farben als Token — vorher fest
// Weiß, #C7C7C7 und Petrol (Launch-Runde 05.09.2026).
export default function BackButton({ label = "Zurück" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="vfa-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 42,
        padding: "10px 22px",
        borderRadius: 999,
        border: "1px solid var(--vfa-grey)",
        background: "var(--vfa-karte)",
        color: "var(--vfa-gruen-text)",
        fontWeight: 700,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
