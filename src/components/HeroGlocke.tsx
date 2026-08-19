"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Hinweis = {
  /** Kurze Überschrift, eine Zeile. */
  titel: string;
  /** Ein Satz dazu. */
  text: string;
  /** Wohin es geht, wenn man den Hinweis antippt. */
  href: string;
};

/**
 * Glocke oben rechts im grünen Kopf des Dashboards.
 *
 * Sie erscheint nur, wenn es etwas zu melden gibt (Tobi, 19.08.2026:
 * "wenn eine Benachrichtigung ist in Rot. Und wenn keine ist, dann halt
 * nicht"). Die Zahl im roten Punkt sagt, wie viele es sind; ein Tipp
 * klappt die Liste auf. Vorher standen dieselben Hinweise als Kacheln
 * über dem Inhalt und schoben das Diagramm nach unten.
 */
export default function HeroGlocke({ hinweise }: { hinweise: Hinweis[] }) {
  const [offen, setOffen] = useState(false);
  const bereichRef = useRef<HTMLDivElement>(null);

  // Tippen daneben schließt die Liste wieder - auf dem Handy die einzige
  // Geste, die man dafür erwartet.
  useEffect(() => {
    if (!offen) return;

    const beiKlick = (e: MouseEvent | TouchEvent) => {
      if (!bereichRef.current?.contains(e.target as Node)) setOffen(false);
    };
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffen(false);
    };

    document.addEventListener("mousedown", beiKlick);
    document.addEventListener("touchstart", beiKlick);
    document.addEventListener("keydown", beiTaste);
    return () => {
      document.removeEventListener("mousedown", beiKlick);
      document.removeEventListener("touchstart", beiKlick);
      document.removeEventListener("keydown", beiTaste);
    };
  }, [offen]);

  if (hinweise.length === 0) return null;

  const anzahl = hinweise.length;

  return (
    <div className="hero-glocke" ref={bereichRef}>
      <button
        type="button"
        className="hero-glocke-knopf"
        onClick={() => setOffen((zustand) => !zustand)}
        aria-expanded={offen}
        aria-label={
          anzahl === 1 ? "Eine Benachrichtigung" : `${anzahl} Benachrichtigungen`
        }
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a5.5 5.5 0 0 0-5.5 5.5v3.1c0 .6-.22 1.18-.62 1.63L4.6 14.75c-.6.67-.12 1.75.78 1.75h13.24c.9 0 1.38-1.08.78-1.75l-1.28-1.52a2.45 2.45 0 0 1-.62-1.63V8.5A5.5 5.5 0 0 0 12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.8 19.2a2.3 2.3 0 0 0 4.4 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>

        <span className="hero-glocke-zahl">{anzahl}</span>
      </button>

      {offen && (
        <div className="hero-glocke-liste" role="dialog" aria-label="Benachrichtigungen">
          {hinweise.map((hinweis) => (
            <Link
              key={hinweis.href + hinweis.titel}
              href={hinweis.href}
              className="hero-glocke-zeile"
              onClick={() => setOffen(false)}
            >
              <span className="hero-glocke-punkt" aria-hidden="true" />
              <span>
                <span className="hero-glocke-titel">{hinweis.titel}</span>
                <span className="hero-glocke-text">{hinweis.text}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
