"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import PdfOverlay from "@/components/PdfOverlay";
import AppButton from "@/components/ui/AppButton";

type KnopfVariante = NonNullable<React.ComponentProps<typeof AppButton>["variant"]>;

/**
 * Link auf ein PDF, der es in der App oeffnet (Vollbild mit X zurueck) statt
 * den Nutzer in den Download zu schicken. Fuer alles, was bisher ein rohes
 * <a href="/api/...pdf"> war. Laedt erst beim Antippen.
 *
 * Mit `knopf` wird statt des nackten Textlinks ein AppButton der genannten
 * Variante gezeigt (Launch-Runde 05.09.2026) — so bleibt der Ansehen-Knopf
 * bei den eigenen Nachweisen im Baukasten, ohne die Pille nachzubauen.
 */
export default function PdfAnsichtLink({
  url,
  titel,
  dateiname,
  style,
  knopf,
  children,
}: {
  url: string;
  titel: string;
  dateiname: string;
  style?: CSSProperties;
  knopf?: KnopfVariante;
  children: ReactNode;
}) {
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(false);

  async function oeffnen() {
    if (laedt) return;
    setLaedt(true);
    setFehler(false);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("leer");
      setAnsicht(window.URL.createObjectURL(blob));
    } catch {
      setFehler(true);
    } finally {
      setLaedt(false);
    }
  }

  return (
    <>
      {knopf ? (
        <AppButton variant={knopf} onClick={oeffnen} disabled={laedt}>
          {children}
        </AppButton>
      ) : (
        <button
          type="button"
          onClick={oeffnen}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            font: "inherit",
            cursor: laedt ? "wait" : "pointer",
            opacity: laedt ? 0.6 : 1,
            ...style,
          }}
        >
          {children}
        </button>
      )}

      {/* Bewusst kein Meldung-Kasten (05.09.2026): Der Text steht in einer
          Tabellenzeile neben dem Link (Meine Schulungen, Dozentenbereich),
          eine Box würde die Zeile sprengen. Farbe und Größe aus den Token. */}
      {fehler && (
        <span style={{ color: "var(--vfa-rot-text)", fontSize: "var(--t-klein)", fontWeight: 700 }}>
          Konnte nicht geöffnet werden.
        </span>
      )}

      {ansicht && (
        <PdfOverlay
          url={ansicht}
          titel={titel}
          dateiname={dateiname}
          onClose={() => {
            window.URL.revokeObjectURL(ansicht);
            setAnsicht(null);
          }}
        />
      )}
    </>
  );
}
