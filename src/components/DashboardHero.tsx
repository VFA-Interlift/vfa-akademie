"use client";

import { useEffect, useState } from "react";

/**
 * Kopfbereich des Dashboards mit zwei Ebenen.
 *
 * Der Kopf bleibt beim Scrollen liegen (position: sticky), der Inhalt darunter
 * schiebt sich mit abgerundeter Oberkante darüber und verdeckt die Begrüßung.
 * Vorbild ist die E.ON-App; die Optik kommt von vfa-interlift.de: Petrol-Grün,
 * feine diagonale Streifen und der gelbe Verlauf in der oberen Ecke.
 *
 * Die Streifen driften sehr langsam nach rechts und der Grund wandert beim
 * Scrollen ein Stück langsamer als der Finger. Beides zusammen ergibt die
 * Tiefe. Wer im Betriebssystem "Bewegung reduzieren" eingeschaltet hat,
 * bekommt einen ruhigen Verlauf ohne jede Animation.
 */
export default function DashboardHero({
  name,
  rangLabel,
  unterzeile,
}: {
  name: string;
  rangLabel: string;
  unterzeile: string;
}) {
  const [gruss, setGruss] = useState("Hallo");
  const [versatz, setVersatz] = useState(0);

  // Die Tageszeit richtet sich nach der Uhr des Geräts, nicht nach dem Server.
  // Deshalb erst nach dem Laden setzen — sonst zeigt Vercel (UTC) am Abend
  // noch "Guten Tag".
  useEffect(() => {
    const stunde = new Date().getHours();
    setGruss(stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend");
  }, []);

  useEffect(() => {
    const sanft = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (sanft.matches) return;

    let angefordert = false;
    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(() => {
        // Nur die ersten 240 Pixel wirken, danach ist der Kopf ohnehin verdeckt.
        setVersatz(Math.min(window.scrollY, 240) * 0.28);
        angefordert = false;
      });
    };

    window.addEventListener("scroll", beiScroll, { passive: true });
    return () => window.removeEventListener("scroll", beiScroll);
  }, []);

  return (
    <div className="dash-hero">
      <div className="dash-hero-grund" style={{ transform: `translate3d(0, ${versatz}px, 0)` }}>
        <div className="dash-hero-streifen" />
        <div className="dash-hero-schein" />
      </div>

      <div className="dash-hero-inhalt">
        <p className="dash-hero-gruss">{gruss}</p>
        <h1 className="dash-hero-name">{name}</h1>
        <div className="dash-hero-zeile">
          <span className="dash-hero-rang">★ {rangLabel}</span>
          <span className="dash-hero-text">{unterzeile}</span>
        </div>
      </div>
    </div>
  );
}
