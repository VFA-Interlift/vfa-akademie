"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ label = "Zurück" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.06)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      ← {label}
    </button>
  );
}
