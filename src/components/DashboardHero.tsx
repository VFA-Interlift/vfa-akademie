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

  // `overflow-x: hidden` steht in globals.css auf html UND body. Das macht das
  // Wurzelelement zum Scroll-Bereich, an dem der Kopf dann klebt statt am
  // Fenster — er wandert einfach mit weg. Am 13.08.2026 im Browser gemessen:
  // ohne Korrektur steht der Kopf nach 800 Pixeln Scrollen bei -800, mit
  // `clip` bei 0. `clip` schneidet seitlich genauso ab, erzeugt aber keinen
  // Scroll-Bereich.
  //
  // Warum per Klasse und nicht in der CSS-Datei: Eine Regel mit `:has()` auf
  // body überlebt den Bauvorgang nicht, sie fehlt im ausgelieferten Stylesheet.
  // Die Klasse wird beim Verlassen der Seite wieder entfernt, damit die
  // anderen Seiten unverändert bleiben.
  useEffect(() => {
    document.documentElement.classList.add("dashboard-aktiv");
    return () => document.documentElement.classList.remove("dashboard-aktiv");
  }, []);

  // Die Tageszeit richtet sich nach der Uhr des Geräts, nicht nach dem Server.
  // Deshalb erst nach dem Laden setzen — sonst zeigt Vercel (UTC) am Abend
  // noch "Guten Tag".
  useEffect(() => {
    const stunde = new Date().getHours();
    setGruss(stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend");
  }, []);

  // Ein Wechsel der theme-color beim Scrollen wurde am 13.08.2026 versucht und
  // wieder ausgebaut: iOS zieht das in installierten Apps nicht nach. Die
  // Statusleiste wird jetzt vom Streifen .safe-top abgedeckt, siehe layout.tsx.

  // Oben auf der Seite bleibt .safe-top durchsichtig, damit hinter der Uhr das
  // echte, bewegte Muster des Kopfes liegt statt einer starren Kopie. Er
  // blendet zwischen 40 und 150 Pixeln Scrollstrecke ein — die helle Fläche
  // erreicht die Statusleiste erst bei rund 186 (Kopfhöhe 216 minus 30
  // Überlappung), die Uhr steht also nie auf hellem Grund.
  //
  // Läuft bewusst auch bei "Bewegung reduzieren": Es geht um die Lesbarkeit
  // der Uhr, nicht um Zierde.
  useEffect(() => {
    const wurzel = document.documentElement;
    let angefordert = false;

    const setzen = () => {
      angefordert = false;
      const deckung = Math.min(Math.max((window.scrollY - 40) / 110, 0), 1);
      wurzel.style.setProperty("--safe-top-deckung", deckung.toFixed(3));
    };
    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(setzen);
    };

    setzen();
    window.addEventListener("scroll", beiScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", beiScroll);
      wurzel.style.removeProperty("--safe-top-deckung");
    };
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
