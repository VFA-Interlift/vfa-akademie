"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function ScanPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const token = (sp.get("token") ?? "").trim();

  useEffect(() => {
    async function run() {
      if (!token) return;

      setStatus("loading");
      setMsg("Code wird eingelöst…");

      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMsg(data?.error ?? "Fehler beim Einlösen.");
        return;
      }

      setStatus("ok");
      setMsg(data?.already ? "Zertifikat war schon vorhanden ✅" : "Zertifikat erfolgreich hinzufügt ✅");
      setTimeout(() => router.push("/meine-badges"), 700);
    }

    run();
  }, [token, router]);

  return (
      <main style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <BackButton />
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>QR scannen</h1>
    </div>

      {!token ? (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          Kein Token in der URL. Bitte QR-Code scannen.
        </div>
      ) : (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {status === "loading" ? "Bitte kurz warten…" : "Status"}
          </div>
          <div>{msg}</div>
        </div>
      )}
    </main>
  );
}
