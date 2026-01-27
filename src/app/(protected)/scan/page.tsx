"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function ScanPage() {
  const router = useRouter();
  const readerId = useMemo(() => "qr-reader", []);
  const qrRef = useRef<any>(null);

  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string>("Tippe auf „Kamera starten“.");
  const [err, setErr] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string | null>(null);

  async function startCamera() {
    setErr(null);
    setStatus("starting");
    setMsg("Kamera wird gestartet…");

    try {
      const mod = await import("html5-qrcode");
      const Html5Qrcode = mod.Html5Qrcode;

      if (!qrRef.current) qrRef.current = new Html5Qrcode(readerId);

      const cameras = await mod.Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setStatus("error");
        setMsg("Keine Kamera gefunden.");
        return;
      }

      const cam = cameras[cameras.length - 1]; // meist Rückkamera

      await qrRef.current.start(
        { deviceId: { exact: cam.id } },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText: string) => {
          if (decodedText === lastText) return;
          setLastText(decodedText);

          setStatus("done");
          setMsg("QR erkannt ✅");

          const token = extractToken(decodedText);
          if (!token) {
            setStatus("error");
            setMsg("QR erkannt, aber kein Token gefunden.");
            return;
          }

          stopCamera().finally(() => {
            router.push(`/scan/claim?token=${encodeURIComponent(token)}`);
          });
        }
      );

      setStatus("scanning");
      setMsg("Kamera aktiv – QR-Code ins Feld halten…");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMsg("Kamera konnte nicht gestartet werden.");
      setErr(String(e?.message ?? e));
    }
  }

  async function stopCamera() {
    try {
      const qr = qrRef.current;
      if (!qr) return;
      if (qr.isScanning) await qr.stop();
      await qr.clear();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <BackButton />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>QR scannen</h1>
      </div>

      <div style={{ marginBottom: 12, color: "rgba(255,255,255,0.85)" }}>{msg}</div>

      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,80,80,0.35)",
            background: "rgba(255,80,80,0.08)",
            color: "rgba(255,255,255,0.9)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 12,
          padding: 12,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div id={readerId} style={{ width: "100%" }} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {status !== "scanning" ? (
          <button
            onClick={startCamera}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Kamera starten
          </button>
        ) : (
          <button
            onClick={() => {
              stopCamera();
              setStatus("idle");
              setMsg("Kamera gestoppt.");
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Hinweis: Kamera funktioniert nur über HTTPS. In iOS/PWA muss der Start per Button erfolgen.
      </div>
    </main>
  );
}

function extractToken(decodedText: string): string | null {
  const t = decodedText.trim();

  // Token direkt
  if (!t.startsWith("http://") && !t.startsWith("https://")) return t;

  // URL mit ?token=
  try {
    const u = new URL(t);
    const token = (u.searchParams.get("token") ?? "").trim();
    return token || null;
  } catch {
    return null;
  }
}
