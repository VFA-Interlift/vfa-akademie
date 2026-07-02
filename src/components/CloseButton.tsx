"use client";

import { useRouter } from "next/navigation";

/**
 * Rundes „×"-Icon oben rechts auf Unterseiten. Geht zur vorigen Seite zurück,
 * fällt bei fehlender History auf einen festen Pfad zurück.
 */
export default function CloseButton({ fallbackHref = "/dashboard" }: { fallbackHref?: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Zurück"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid #E0E0E0",
        background: "#FFFFFF",
        color: "#1F1F1F",
        fontSize: 22,
        lineHeight: 1,
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      ×
    </button>
  );
}
