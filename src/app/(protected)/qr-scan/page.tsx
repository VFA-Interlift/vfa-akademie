"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanPage() {
  const router = useRouter();

  const readerId = useMemo(() => "qr-reader", []);
  const qrRef = useRef<Html5Qrcode | null>(null);

  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string>("Tippe auf „Kamera starten“.");
  const [lastText, setLastText] = useState<string | null>(null);

  // iOS/PWA: Kamera-Start sollte per User-Interaktion passieren => Button
  async function startCamera() {
    try {
      setStatus("starting");
      setMsg("Kamera wird gestartet…");

      if (!qrRef.current) qrRef.current = new Html5Qrcode(readerId);

      // bevorzugt Rückkamera
      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await qrRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Duplikate vermeiden
          if (decodedText === lastText) return;
          setLastText(decodedText);

          setStatus("done");
          setMsg("QR erkannt ✅");

          // QR kann entweder Token sein ODER eine URL mit ?token=...
          const token = extractToken(decodedText);
          if (!token) {
            setStatus("error");
            setMsg("QR erkannt, aber kein Token gefunden.");
            return;
          }

          // Kamera stoppen (sauber)
          stopCamera().finally(() => {
            router.push(`/scan?token=${encodeURIComponent(token)}`);
          });
        },
        () => {
          // scan failure callback (häufig, einfach ignorieren)
        }
      );

      setStatus("scanning");
      setMsg("Kamera aktiv – QR-Code ins Feld halten…");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMsg(
        "Kamera konnte nicht gestartet werden. Prüfe Berechtigungen (Safari/Browser) und ob du über HTTPS unterwegs bist."
      );
    }
  }

  async function stopCamera() {
    try {
      const qr = qrRef.current;
      if (!qr) return;
      if (qr.isScanning) {
        await qr.stop();
      }
      await qr.clear();
    } catch (e) {
      // ignore
    } finally {
      // wir lassen qrRef.current bestehen, aber Scanner ist gestoppt/cleared
    }
  }

  useEffect(() => {
    // Cleanup beim Verlassen der Seite
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

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 12,
          padding: 12,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {/* Scanner Mount */}
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

        <button
          onClick={() => router.push("/meine-badges")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "transparent",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Zu meinen Zertifikaten
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Hinweis: Kamera funktioniert nur über HTTPS (Vercel ist OK). In iOS-PWA ist ein Tap auf „Kamera starten“
        notwendig.
      </div>
    </main>
  );
}

function extractToken(decodedText: string): string | null {
  const t = decodedText.trim();

  // Fall 1: QR enthält direkt nur den Token
  // (du nutzt z.B. "Grundkurs A1-2601")
  if (!t.startsWith("http://") && !t.startsWith("https://")) {
    return t;
  }

  // Fall 2: QR enthält eine URL wie .../scan?token=...
  try {
    const u = new URL(t);
    const token = (u.searchParams.get("token") ?? "").trim();
    return token || null;
  } catch {
    return null;
  }
}
