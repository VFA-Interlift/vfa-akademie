"use client";

import { useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";

type PageHeaderProps = {
  title: string;
  description?: string;
  backLabel?: string;
  showBackButton?: boolean;
  showTitle?: boolean;
};

/**
 * Der Seitenkopf aller Seiten außer dem Dashboard: dieselben Bauteile wie der
 * Dashboard-Kopf (Streifen, Gelbschein) als kompaktes Band nur bis zur
 * Überschrift; die helle Fläche schiebt sich mit runden Ecken darüber
 * (globals.css, .seiten-kopf). Auf dem Handy läuft das Band bis unter die
 * Statusleiste — SafeTop entfällt auf diesen Seiten.
 *
 * Beim Scrollen bewegt sich alles wie auf dem Dashboard (Tobis Ansage vom
 * 13.08.2026 abends): Die Überschrift zieht langsamer als der Inhalt davon
 * (Bildschirm-Geschwindigkeit 0,3-fach nach oben), das Muster driftet leicht
 * nach unten (0,28-fach). Weil das Band — anders als der klebende
 * Dashboard-Kopf — selbst mitscrollt, sind die Versätze hier GEGENläufig
 * aufgerechnet; die sichtbare Bewegung ist dieselbe.
 */
export default function PageHeader({
  title,
  backLabel = "Zurück",
  // Untere Menüleiste (BottomNav) + Browser-Zurück decken die Navigation ab,
  // daher standardmäßig kein redundanter Zurück-Button mehr oben.
  showBackButton = false,
  showTitle = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  description: _description,
}: PageHeaderProps) {
  const grundRef = useRef<HTMLDivElement>(null);
  const inhaltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angefordert = false;
    const setzen = () => {
      angefordert = false;
      // Ab ~160 Pixeln ist das Band aus dem Bild; weiter rechnen lohnt nicht.
      const s = Math.min(window.scrollY, 160);
      if (grundRef.current) {
        grundRef.current.style.transform = `translate3d(0, ${(s * 1.28).toFixed(1)}px, 0)`;
      }
      if (inhaltRef.current) {
        inhaltRef.current.style.transform = `translate3d(0, ${(s * 0.7).toFixed(1)}px, 0)`;
      }
    };
    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(setzen);
    };

    setzen();
    window.addEventListener("scroll", beiScroll, { passive: true });
    return () => window.removeEventListener("scroll", beiScroll);
  }, []);

  return (
    <div className="seiten-kopf">
      <div ref={grundRef} className="seiten-kopf-grund" aria-hidden="true">
        <div className="dash-hero-streifen" />
        <div className="dash-hero-schein" />
      </div>

      <div ref={inhaltRef} style={{ position: "relative" }}>
        {showBackButton && (
          <div style={{ marginBottom: 14 }}>
            <BackButton label={backLabel} />
          </div>
        )}
        {showTitle && (
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 5vw, 28px)",
              fontWeight: 800,
              // Fest weiß: Das Band ist in beiden Modi Petrol.
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
