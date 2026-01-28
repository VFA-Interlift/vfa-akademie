"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const next = sp.get("next") || "/";

    const t = setTimeout(() => {
      router.replace(next);
    }, 2000);

    return () => clearTimeout(t);
  }, [router, sp]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #111 0%, #000 80%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 22,
        color: "#fff",
      }}
    >
      <img
        src="/logo.png"
        alt="VFA Akademie"
        style={{ width: 140, height: "auto", opacity: 0.95 }}
      />
      <h1 style={{ fontSize: 30, margin: 0, fontWeight: 800 }}>VFA Akademie</h1>
      <p style={{ opacity: 0.6, margin: 0 }}>wird geladen…</p>
    </div>
  );
}
