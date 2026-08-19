"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import HeroGlocke, { type Hinweis } from "@/components/HeroGlocke";

// Layout-Effekte laufen synchron vor dem Zeichnen — beim Serverrendern gibt es
// sie nicht, dort genügt der normale Effekt (die Warnung wäre nur Rauschen).
const useVorDemZeichnen = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  naechste,
  hinweise = [],
}: {
  name: string;
  rangLabel: string;
  unterzeile: string;
  /** Nächste Schulung für den Countdown; ohne sie bleibt die Unterzeile. */
  naechste?: { kuerzel: string; datumISO: string; endeISO: string | null };
  /** Offene Erinnerungen für die Glocke oben rechts. Leer = keine Glocke. */
  hinweise?: Hinweis[];
}) {
  const [gruss, setGruss] = useState("Hallo");
  const [zeile, setZeile] = useState(unterzeile);
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
  // Inline-Skript in layout.tsx; für Tab-Wechsel INNERHALB der App läuft das
  // Setzen/Entfernen hier als Layout-Effekt — synchron vor dem Zeichnen,
  // sonst sprang der Inhalt bei jedem Wechsel vom und zum Dashboard um die
  // Statusleistenhöhe (Ultracode-Befund 13.08.2026).
  useVorDemZeichnen(() => {
    document.documentElement.classList.add("dashboard-aktiv");
    return () => document.documentElement.classList.remove("dashboard-aktiv");
  }, []);

  // Die Tageszeit richtet sich nach der Uhr des Geräts, nicht nach dem Server
  // (Vercel läuft auf UTC und zeigte sonst abends "Guten Tag"). Zusätzlich bei
  // jedem Aufwecken neu prüfen: iOS lädt eine installierte App beim Öffnen
  // meist nicht neu, sondern weckt den alten Stand — wer die App morgens
  // öffnete, sah abends sonst noch "Guten Morgen" (Tobi, 13.08.2026).
  //
  // Reihenfolge der Grüße: erst die wenigen besonderen Tage, dann Wochenende
  // und Wochenstart, dann die Tageszeit. Bewusst knapp gehalten — ein Gruß,
  // der jeden Tag anders klingt, wirkt schnell bemüht.
  useEffect(() => {
    const aktualisieren = () => {
      const jetzt = new Date();
      const stunde = jetzt.getHours();
      const wochentag = jetzt.getDay(); // 0 So … 5 Fr, 6 Sa
      const tag = jetzt.getDate();
      const monat = jetzt.getMonth() + 1;

      let text: string;
      if (monat === 12 && tag >= 24 && tag <= 26) {
        text = "Frohe Weihnachten";
      } else if (monat === 12 && tag === 31) {
        text = "Guten Rutsch";
      } else if (monat === 1 && tag === 1) {
        text = "Frohes neues Jahr";
      } else if (wochentag === 5 && stunde >= 12) {
        text = "Schönes Wochenende";
      } else if (wochentag === 1 && stunde < 11) {
        text = "Guten Start in die Woche";
      } else if (stunde < 11) {
        text = "Guten Morgen";
      } else if (stunde < 18) {
        text = "Guten Tag";
      } else {
        text = "Guten Abend";
      }
      setGruss(text);

      // Countdown zur nächsten Schulung — nach Kalendertagen auf der
      // Geräteuhr, nicht nach Stunden: "morgen" heißt morgen, auch wenn es
      // erst in 30 Stunden losgeht.
      if (naechste) {
        const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
        const beginn = new Date(naechste.datumISO);
        const start = new Date(beginn.getFullYear(), beginn.getMonth(), beginn.getDate());
        const ende = naechste.endeISO ? new Date(naechste.endeISO) : beginn;
        const schluss = new Date(ende.getFullYear(), ende.getMonth(), ende.getDate());
        const tage = Math.round((start.getTime() - heute.getTime()) / 86_400_000);

        if (heute >= start && heute <= schluss) {
          setZeile(`Heute ist es so weit: ${naechste.kuerzel}`);
        } else if (tage === 1) {
          setZeile(`Morgen geht es los: ${naechste.kuerzel}`);
        } else if (tage > 1) {
          setZeile(`Noch ${tage} Tage bis ${naechste.kuerzel}`);
        } else {
          setZeile(unterzeile);
        }
      }
    };

    aktualisieren();
    document.addEventListener("visibilitychange", aktualisieren);
    return () => document.removeEventListener("visibilitychange", aktualisieren);
  }, [naechste, unterzeile]);

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
        // Faktor 0.45 nach Tobis zweiter Nachjustierung vom 13.08.2026
        // („noch ein Tick mehr") — vorher 0.3, davor 0.18.
        inhaltRef.current.style.transform = `translate3d(0, ${(weite * -0.45).toFixed(1)}px, 0)`;
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
      {/* Petrol, feine Streifen, gelber Schein in der Ecke — der Schein war am
          13.08.2026 kurz draußen und ist auf Tobis Ansage zurück („dieser
          gelbe Schimmer oben rechts ist gut"). Was ihn wirklich störte, war
          der weiße Schleier der Kopf-Ausblendung; die bleibt draußen. */}
      <div ref={grundRef} className="dash-hero-grund">
        <div className="dash-hero-streifen" />
        <div className="dash-hero-schein" />
      </div>

      {/* Die Glocke bleibt beim Scrollen stehen, wo sie ist — sie gehört zur
          Leiste, nicht zum Text, der nach oben wegdriftet. */}
      <HeroGlocke hinweise={hinweise} />

      <div ref={inhaltRef} className="dash-hero-inhalt">
        <p className="dash-hero-gruss">{gruss}</p>
        <h1 className="dash-hero-name">{name}</h1>
        <div className="dash-hero-zeile">
          <span className="dash-hero-rang">★ {rangLabel}</span>
          <span className="dash-hero-text">{zeile}</span>
        </div>
      </div>
    </div>
  );
}
