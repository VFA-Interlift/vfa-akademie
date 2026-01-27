"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

type Status = "idle" | "loading" | "ok" | "error";

export default function ClaimClient({ token }: { token: string }) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [pill, setPill] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) return;

      setStatus("loading");
      setMsg("Code wird eingelöst…");
      setPill(null);

      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setStatus("error");
        setMsg(data?.error ?? "Fehler beim Einlösen.");
        return;
      }

      const already = Boolean(data?.already);
      const creditsAwarded = Number(data?.creditsAwarded ?? 0);
      const creditsTotal = Number(data?.creditsTotal ?? 0);

      setStatus("ok");

      if (already) {
        setMsg("Zertifikat war schon vorhanden ✅");
        setPill(`Credits: ${creditsTotal}`);
      } else {
        setMsg("Zertifikat hinzugefügt ✅");
        if (creditsAwarded > 0) setPill(`+${creditsAwarded} Credits • Gesamt: ${creditsTotal}`);
        else setPill(`Credits: ${creditsTotal}`);
      }

      setTimeout(() => {
        router.push("/meine-badges");
        router.refresh();
      }, 900);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <BackButton />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>QR scannen</h1>
      </div>

      {!token ? (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          Kein Token in der URL. Bitte QR-Code scannen.
        </div>
      ) : (
        <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            {status === "loading"
              ? "Bitte kurz warten…"
              : status === "ok"
              ? "Erfolg"
              : status === "error"
              ? "Fehler"
              : "Status"}
          </div>

          <div style={{ fontSize: 16, lineHeight: 1.4 }}>{msg}</div>

          {pill && (
            <div
              style={{
                marginTop: 10,
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                fontWeight: 900,
              }}
            >
              {pill}
            </div>
          )}

          {status === "loading" && (
            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.7)" }}>
              Danach wirst du automatisch weitergeleitet…
            </div>
          )}
        </div>
      )}
    </main>
  );
}
