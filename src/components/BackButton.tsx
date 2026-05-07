"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ label = "Zurück" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 40,
        padding: "9px 16px",
        borderRadius: 999,
        border: "1px solid #C7C7C7",
        background: "#FFFFFF",
        color: "#007873",
        fontWeight: 800,
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}