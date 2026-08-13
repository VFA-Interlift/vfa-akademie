"use client";

import { useEffect, useState } from "react";

/**
 * Schalter für die Push-Erinnerung („Morgen ist deine Schulung").
 *
 * Zustände, die der Nutzer sehen kann:
 *  - nicht unterstützt: Gerät/Browser kann kein Web Push (oder die App liegt
 *    auf dem iPhone nicht auf dem Home-Bildschirm — dort geht Push nur so).
 *  - aus: unterstützt, aber kein Abo auf diesem Gerät.
 *  - aktiv: dieses Gerät bekommt Erinnerungen.
 *  - blockiert: Mitteilungen wurden auf Systemebene verweigert; das kann nur
 *    der Nutzer selbst in den Geräte-Einstellungen zurücknehmen.
 */
type Zustand = "prueft" | "nicht-unterstuetzt" | "aus" | "aktiv" | "blockiert";

function base64ZuUint8(base64: string) {
  const auffuellung = "=".repeat((4 - (base64.length % 4)) % 4);
  const roh = window.atob((base64 + auffuellung).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}

export default function PushEinstellung() {
  const [zustand, setZustand] = useState<Zustand>("prueft");
  const [arbeitet, setArbeitet] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setZustand("nicht-unterstuetzt");
        return;
      }
      if (Notification.permission === "denied") {
        setZustand("blockiert");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const abo = await reg.pushManager.getSubscription();
        setZustand(abo ? "aktiv" : "aus");
        // Kontowechsel am selben Gerät: Das Abo hängt sonst noch am vorigen
        // Konto und liefert fremde Erinnerungen. Der Upsert schreibt es dem
        // aktuell Angemeldeten zu (Ultracode-Hinweis 13.08.2026).
        if (abo) {
          fetch("/api/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(abo.toJSON()),
          }).catch(() => {});
        }
      } catch {
        setZustand("aus");
      }
    })();
  }, []);

  async function aktivieren() {
    setArbeitet(true);
    try {
      const erlaubnis = await Notification.requestPermission();
      if (erlaubnis !== "granted") {
        setZustand(erlaubnis === "denied" ? "blockiert" : "aus");
        return;
      }

      const antwort = await fetch("/api/push", { cache: "no-store" }).then((r) => r.json());
      if (!antwort?.publicKey) return;

      const reg = await navigator.serviceWorker.ready;
      const abo = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ZuUint8(antwort.publicKey),
      });

      const ok = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(abo.toJSON()),
      }).then((r) => r.ok);

      setZustand(ok ? "aktiv" : "aus");
      if (!ok) await abo.unsubscribe().catch(() => {});
    } catch {
      setZustand("aus");
    } finally {
      setArbeitet(false);
    }
  }

  async function deaktivieren() {
    setArbeitet(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const abo = await reg.pushManager.getSubscription();
      if (abo) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: abo.endpoint }),
        }).catch(() => {});
        await abo.unsubscribe().catch(() => {});
      }
      setZustand("aus");
    } finally {
      setArbeitet(false);
    }
  }

  if (zustand === "prueft") return null;

  if (zustand === "nicht-unterstuetzt") {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--vfa-text-3)", lineHeight: 1.5 }}>
        Mitteilungen aufs Handy gehen auf diesem Gerät nicht. Auf dem iPhone
        funktionieren sie nur, wenn die App über „Teilen → Zum Home-Bildschirm"
        installiert ist und von dort geöffnet wird.
      </p>
    );
  }

  if (zustand === "blockiert") {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--vfa-text-3)", lineHeight: 1.5 }}>
        Mitteilungen sind für diese App auf Systemebene ausgeschaltet. Zum
        Einschalten: Geräte-Einstellungen → Mitteilungen → VFA-Akademie.
      </p>
    );
  }

  const aktiv = zustand === "aktiv";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--vfa-text-2)", lineHeight: 1.5 }}>
        {aktiv
          ? "Dieses Gerät erinnert dich am Vortag deiner Schulung."
          : "Bekomme am Vortag deiner Schulung eine Mitteilung aufs Handy."}
      </p>
      <button
        type="button"
        onClick={aktiv ? deaktivieren : aktivieren}
        disabled={arbeitet}
        style={{
          justifySelf: "start",
          padding: "10px 20px",
          borderRadius: 999,
          border: aktiv ? "1px solid var(--vfa-linie)" : "none",
          background: aktiv ? "transparent" : "#007873",
          color: aktiv ? "var(--vfa-text-2)" : "#FFFFFF",
          fontSize: 14,
          fontWeight: 800,
          cursor: arbeitet ? "wait" : "pointer",
          opacity: arbeitet ? 0.6 : 1,
        }}
      >
        {arbeitet ? "Einen Moment …" : aktiv ? "Erinnerung ausschalten" : "Erinnerung aktivieren"}
      </button>
    </div>
  );
}
