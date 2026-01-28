"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ label = "Zurück" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        border: "1px solid rgba(0,0,0,0.15)",
        background: "white",
        color: "#111",
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      ← {label}
    </button>
  );
}
