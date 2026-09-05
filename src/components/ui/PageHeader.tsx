"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";

type PageHeaderProps = {
  title: string;
  description?: string;
  backLabel?: string;
  showBackButton?: boolean;
  showTitle?: boolean;
  /** Fester Rückweg (z. B. "/admin") — erscheint weiß IM Band über dem Titel.
      Vorher lag der Link der Admin-Unterseiten unsichtbar UNTER dem Band
      (Ultracode-Befund 13.08.2026). */
  backHref?: string;
};

/**
 * Der Seitenkopf aller Seiten außer dem Dashboard: dieselben Bauteile wie der
 * Dashboard-Kopf (Streifen, Gelbschein) als kompaktes Band nur bis zur
 * Überschrift; die helle Fläche schiebt sich mit runden Ecken darüber
 * (globals.css, .seiten-kopf). Auf dem Handy läuft das Band bis unter die
 * Statusleiste und gibt der weißen Uhr den Grund — der Deckstreifen SafeTop
 * ist seit dem 05.09.2026 überall aus.
 *
 * Beim Scrollen bewegt sich alles wie auf dem Dashboard (Tobis Ansage vom
 * 13.08.2026 abends): Die Überschrift zieht langsamer als der Inhalt davon
 * (Bildschirm-Geschwindigkeit 0,45-fach nach oben), das Muster driftet leicht
 * nach unten (0,28-fach). Weil das Band — anders als der klebende
 * Dashboard-Kopf — selbst mitscrollt, sind die Versätze hier GEGENläufig
 * aufgerechnet; die sichtbare Bewegung ist dieselbe.
 */
export default function PageHeader({
  title,
  backHref,
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
    // Nur am Handy: Am Desktop ist das Band ein ruhendes Feld im Inhalt —
    // dort schob die Verschiebung den Titel aus dem Band (Ultracode-Hinweis).
    // Die Abfrage lebt IM Handler: Wird das Browserfenster nachträglich auf
    // Desktop-Breite gezogen, lief der einmal registrierte Handler sonst
    // weiter und verschob das ruhende Band (Gegenprüfung 13.08.2026).
    const handy = window.matchMedia("(max-width: 759px)");

    let angefordert = false;
    const setzen = () => {
      angefordert = false;
      if (!handy.matches) {
        if (grundRef.current) grundRef.current.style.transform = "";
        if (inhaltRef.current) inhaltRef.current.style.transform = "";
        return;
      }
      // Ab ~160 Pixeln ist das Band aus dem Bild; weiter rechnen lohnt nicht.
      const s = Math.min(window.scrollY, 160);
      if (grundRef.current) {
        grundRef.current.style.transform = `translate3d(0, ${(s * 1.28).toFixed(1)}px, 0)`;
      }
      if (inhaltRef.current) {
        inhaltRef.current.style.transform = `translate3d(0, ${(s * 0.55).toFixed(1)}px, 0)`;
      }
    };
    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(setzen);
    };

    setzen();
    window.addEventListener("scroll", beiScroll, { passive: true });
    // Beim Überschreiten der Breitengrenze sofort aufräumen bzw. einsetzen,
    // nicht erst beim nächsten Scroll.
    handy.addEventListener("change", beiScroll);
    return () => {
      window.removeEventListener("scroll", beiScroll);
      handy.removeEventListener("change", beiScroll);
    };
  }, []);

  return (
    <div className="seiten-kopf">
      <div ref={grundRef} className="seiten-kopf-grund" aria-hidden="true">
        <div className="dash-hero-streifen" />
        <div className="dash-hero-schein" />
      </div>

      <div ref={inhaltRef} style={{ position: "relative" }}>
        {/* Link statt <a>: ein natives <a> lud die ganze App neu (05.09.2026). */}
        {backHref && (
          <Link
            href={backHref}
            style={{
              display: "inline-block",
              marginBottom: 10,
              color: "rgba(255,255,255,0.85)",
              fontSize: "var(--t-klein)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← {backLabel}
          </Link>
        )}
        {showBackButton && (
          <div style={{ marginBottom: 14 }}>
            <BackButton label={backLabel} />
          </div>
        )}
        {showTitle && (
          <h1
            style={{
              margin: 0,
              // Schriftstaffel (--t-titel): ruhiger als das frühere clamp bis 28px.
              fontSize: "var(--t-titel)",
              fontWeight: 750,
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
