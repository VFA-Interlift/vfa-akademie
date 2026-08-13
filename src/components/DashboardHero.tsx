"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Kopfbereich des Dashboards mit zwei Ebenen.
 *
 * Der Kopf bleibt beim Scrollen liegen (position: sticky), der Inhalt darunter
 * schiebt sich mit abgerundeter Oberkante darüber und verdeckt die Begrüßung.
 * Vorbild ist die E.ON-App; die Optik kommt von vfa-interlift.de: Petrol-Grün,
 * feine diagonale Streifen und der gelbe Verlauf in der oberen Ecke.
 *
 * Zwei Geschwindigkeiten geben die Tiefe: der Grund wandert beim Scrollen
 * leicht nach unten, Name und Begrüßung driften nach oben, während die helle
 * Fläche sich darüberschiebt. Wer im Betriebssystem "Bewegung reduzieren"
 * eingeschaltet hat, bekommt einen ruhigen Verlauf ohne jede Animation.
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
  const grundRef = useRef<HTMLDivElement>(null);
  const inhaltRef = useRef<HTMLDivElement>(null);

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
  // anderen Seiten unverändert bleiben. Beim ersten Zeichnen setzt sie das
  // Inline-Skript in layout.tsx, sonst blitzte der Streifen .safe-top auf.
  useEffect(() => {
    document.documentElement.classList.add("dashboard-aktiv");
    return () => document.documentElement.classList.remove("dashboard-aktiv");
  }, []);

  // Die Tageszeit richtet sich nach der Uhr des Geräts, nicht nach dem Server
  // (Vercel läuft auf UTC und zeigte sonst abends "Guten Tag"). Zusätzlich bei
  // jedem Aufwecken neu prüfen: iOS lädt eine installierte App beim Öffnen
  // meist nicht neu, sondern weckt den alten Stand — wer die App morgens
  // öffnete, sah abends sonst noch "Guten Morgen" (Tobi, 13.08.2026).
  useEffect(() => {
    const aktualisieren = () => {
      const stunde = new Date().getHours();
      setGruss(stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend");
    };

    aktualisieren();
    document.addEventListener("visibilitychange", aktualisieren);
    return () => document.removeEventListener("visibilitychange", aktualisieren);
  }, []);

  // Auf dem Dashboard gibt es keinen Deckstreifen hinter der Statusleiste —
  // Tobis Entscheidung vom 13.08.2026 („Weg mit der Uhr"): Ihm ist wichtiger,
  // dass beim Scrollen kein grüner Streifen über der hellen Fläche steht, als
  // dass die weiße Uhrzeit dort lesbar bleibt. SafeTop.tsx lässt den Streifen
  // hier gar nicht erst entstehen. (Ein Wechsel der theme-color beim Scrollen
  // wurde ebenfalls versucht — iOS zieht ihn in installierten Apps nicht nach.)

  // Die Verschiebung geht direkt an die Elemente, ohne React-Zustand: der
  // Umweg über setState baute bei jedem Bildschirmschritt den ganzen Kopf neu
  // auf und ruckelte auf dem iPhone spürbar (Tobi, 13.08.2026).
  useEffect(() => {
    const sanft = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (sanft.matches) return;

    let angefordert = false;
    const setzen = () => {
      angefordert = false;
      // Nur die ersten 260 Pixel wirken, danach ist der Kopf ohnehin verdeckt.
      const weite = Math.min(window.scrollY, 260);
      if (grundRef.current) {
        grundRef.current.style.transform = `translate3d(0, ${(weite * 0.28).toFixed(1)}px, 0)`;
      }
      if (inhaltRef.current) {
        // Faktor 0.3 nach Tobis Nachjustierung vom 13.08.2026 — 0.18 war zu wenig.
        inhaltRef.current.style.transform = `translate3d(0, ${(weite * -0.3).toFixed(1)}px, 0)`;
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
    <div className="dash-hero">
      {/* Nur Petrol mit feinen Streifen, ohne Farbverläufe: Der gelbe Schein
          in der Ecke stand beim Scrollen als andersfarbiger Rand über der
          Karte — Tobi hat ihn am 13.08.2026 komplett streichen lassen
          („dass das so bleibt wie der Rest"). Ebenso raus: das Ausblenden des
          Kopfes, das nur einen weißen Übergang erzeugte. */}
      <div ref={grundRef} className="dash-hero-grund">
        <div className="dash-hero-streifen" />
      </div>

      <div ref={inhaltRef} className="dash-hero-inhalt">
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
