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
  const [scrollWeite, setScrollWeite] = useState(0);

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

  // Auf dem Dashboard gibt es keinen Deckstreifen hinter der Statusleiste —
  // Tobis Entscheidung vom 13.08.2026 („Weg mit der Uhr"): Ihm ist wichtiger,
  // dass beim Scrollen kein grüner Streifen über der hellen Fläche steht, als
  // dass die weiße Uhrzeit dort lesbar bleibt. Oben auf der Seite steht sie
  // auf dem Petrol des Kopfes und ist gut zu sehen; nur gescrollt verschwindet
  // sie optisch. Die Ausblendung steht in globals.css (html.dashboard-aktiv).

  useEffect(() => {
    const sanft = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (sanft.matches) return;

    let angefordert = false;
    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(() => {
        // Nur die ersten 260 Pixel wirken, danach ist der Kopf ohnehin verdeckt.
        setScrollWeite(Math.min(window.scrollY, 260));
        angefordert = false;
      });
    };

    window.addEventListener("scroll", beiScroll, { passive: true });
    return () => window.removeEventListener("scroll", beiScroll);
  }, []);

  return (
    <div className="dash-hero">
      {/* Zwei Geschwindigkeiten geben die Tiefe: der Grund wandert mit dem
          Scrollen leicht nach unten, Name und Begrüßung driften nach oben,
          während die helle Fläche sich darüberschiebt. Faktor 0.3 nach Tobis
          Nachjustierung vom 13.08.2026 — 0.18 war ihm zu wenig. */}
      <div
        className="dash-hero-grund"
        style={{ transform: `translate3d(0, ${(scrollWeite * 0.28).toFixed(1)}px, 0)` }}
      >
        <div className="dash-hero-streifen" />
        <div className="dash-hero-schein" />
      </div>

      <div
        className="dash-hero-inhalt"
        style={{ transform: `translate3d(0, ${(scrollWeite * -0.3).toFixed(1)}px, 0)` }}
      >
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
