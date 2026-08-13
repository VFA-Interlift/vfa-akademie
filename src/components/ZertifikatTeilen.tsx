"use client";

import { useState } from "react";

/**
 * Macht aus einem Zertifikat eine Bildkarte zum Teilen (LinkedIn, WhatsApp …).
 *
 * Die Karte wird im Browser auf einer Zeichenfläche gebaut — VFA-Optik wie der
 * Dashboard-Kopf: Petrol, feine diagonale Streifen, gelber Schein in der Ecke.
 * Das offizielle Zertifikat-PDF bleibt unangetastet (Dauerregel); das hier ist
 * ein eigenes Bild, kein Ersatz für den Nachweis.
 *
 * Auf dem Handy öffnet sich das Teilen-Blatt des Systems; wo das nicht geht
 * (Desktop), wird das Bild heruntergeladen.
 */
export default function ZertifikatTeilen({
  titel,
  zeitraum,
  credits,
}: {
  titel: string;
  zeitraum: string;
  credits: number;
}) {
  const [laeuft, setLaeuft] = useState(false);

  async function teilen() {
    if (laeuft) return;
    setLaeuft(true);
    try {
      // Name des Teilnehmers für die Karte — erst beim Klick geholt.
      let name = "";
      try {
        const me = await fetch("/api/me", { cache: "no-store" }).then((r) => r.json());
        name = (me?.name as string) || "";
      } catch {}

      await document.fonts.ready;

      const B = 1080;
      const H = 1080;
      const leinwand = document.createElement("canvas");
      leinwand.width = B;
      leinwand.height = H;
      const z = leinwand.getContext("2d");
      if (!z) return;

      // Grund
      z.fillStyle = "#007873";
      z.fillRect(0, 0, B, H);

      // Feine diagonale Streifen wie im Dashboard-Kopf
      z.save();
      z.strokeStyle = "rgba(255, 255, 255, 0.07)";
      z.lineWidth = 5;
      for (let x = -H; x < B + H; x += 38) {
        z.beginPath();
        z.moveTo(x, 0);
        z.lineTo(x + H, H);
        z.stroke();
      }
      z.restore();

      // Gelber Schein oben rechts, dunkle Abschattung unten links
      const gelb = z.createRadialGradient(B, 0, 0, B, 0, 980);
      gelb.addColorStop(0, "rgba(255, 193, 0, 0.85)");
      gelb.addColorStop(0.35, "rgba(255, 193, 0, 0.25)");
      gelb.addColorStop(0.65, "rgba(255, 193, 0, 0)");
      z.fillStyle = gelb;
      z.fillRect(0, 0, B, H);

      const dunkel = z.createRadialGradient(0, H, 0, 0, H, 800);
      dunkel.addColorStop(0, "rgba(0, 55, 53, 0.55)");
      dunkel.addColorStop(1, "rgba(0, 55, 53, 0)");
      z.fillStyle = dunkel;
      z.fillRect(0, 0, B, H);

      // next/font registriert Inter unter einem generierten Namen — den echten
      // Namen von der Seite uebernehmen, sonst malt die Leinwand Systemschrift.
      const schrift = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";

      // Kopfzeile
      z.fillStyle = "rgba(255, 255, 255, 0.85)";
      z.font = `800 34px ${schrift}`;
      z.fillText("V F A - A K A D E M I E", 84, 130);

      z.fillStyle = "#FFC100";
      z.font = `800 44px ${schrift}`;
      z.fillText("Zertifikat", 84, 250);

      // Kurstitel, umbrochen
      z.fillStyle = "#FFFFFF";
      z.font = `800 76px ${schrift}`;
      const zeilen = umbrechen(z, titel, B - 168);
      let y = 360;
      for (const zeile of zeilen.slice(0, 4)) {
        z.fillText(zeile, 84, y);
        y += 92;
      }

      // Name und Zeitraum
      if (name) {
        z.fillStyle = "rgba(255, 255, 255, 0.92)";
        z.font = `700 46px ${schrift}`;
        z.fillText(name, 84, y + 40);
        y += 60;
      }
      z.fillStyle = "rgba(255, 255, 255, 0.72)";
      z.font = `600 38px ${schrift}`;
      z.fillText(zeitraum, 84, y + 56);

      // Credits-Plakette
      const plakette = `+${credits.toLocaleString("de-DE")} Credits`;
      z.font = `800 40px ${schrift}`;
      const pb = z.measureText(plakette).width + 72;
      const py = H - 210;
      z.fillStyle = "rgba(255, 255, 255, 0.14)";
      z.strokeStyle = "rgba(255, 255, 255, 0.35)";
      z.lineWidth = 2;
      abgerundet(z, 84, py, pb, 84, 42);
      z.fill();
      z.stroke();
      z.fillStyle = "#FFFFFF";
      z.fillText(plakette, 84 + 36, py + 56);

      // Fußzeile
      z.fillStyle = "rgba(255, 255, 255, 0.55)";
      z.font = `600 30px ${schrift}`;
      z.fillText("vfa-akademie.vercel.app", 84, H - 62);

      const blob: Blob | null = await new Promise((erledigt) =>
        leinwand.toBlob(erledigt, "image/png")
      );
      if (!blob) return;

      const datei = new File([blob], "vfa-zertifikat.png", { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [datei] })) {
        try {
          await navigator.share({ files: [datei], title: "Mein VFA-Zertifikat" });
        } catch {
          // Abbruch durch den Nutzer ist kein Fehler — und ausdruecklich auch
          // kein Grund, ihm das Bild ungefragt in die Downloads zu legen.
        }
        return;
      }

      const adresse = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = adresse;
      a.download = "vfa-zertifikat.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(adresse), 10_000);
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <button
      type="button"
      onClick={teilen}
      disabled={laeuft}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 42,
        padding: "10px 18px",
        borderRadius: 999,
        background: "transparent",
        color: "#007873",
        border: "1px solid #007873",
        fontSize: 14,
        fontWeight: 800,
        cursor: laeuft ? "wait" : "pointer",
        opacity: laeuft ? 0.6 : 1,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>↗</span>
      {laeuft ? "Wird vorbereitet …" : "Teilen"}
    </button>
  );
}

/** Bricht einen Text an Wortgrenzen auf die gegebene Breite um. */
function umbrechen(z: CanvasRenderingContext2D, text: string, maxBreite: number) {
  const woerter = text.split(/\s+/);
  const zeilen: string[] = [];
  let aktuelle = "";
  for (const wort of woerter) {
    const versuch = aktuelle ? `${aktuelle} ${wort}` : wort;
    if (z.measureText(versuch).width > maxBreite && aktuelle) {
      zeilen.push(aktuelle);
      aktuelle = wort;
    } else {
      aktuelle = versuch;
    }
  }
  if (aktuelle) zeilen.push(aktuelle);
  return zeilen;
}

/** Rechteck mit runden Ecken als Pfad. */
function abgerundet(
  z: CanvasRenderingContext2D,
  x: number,
  y: number,
  b: number,
  h: number,
  r: number
) {
  z.beginPath();
  z.moveTo(x + r, y);
  z.arcTo(x + b, y, x + b, y + h, r);
  z.arcTo(x + b, y + h, x, y + h, r);
  z.arcTo(x, y + h, x, y, r);
  z.arcTo(x, y, x + b, y, r);
  z.closePath();
}
