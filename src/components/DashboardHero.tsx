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

  // Die Statusleiste des iPhones gehört dem Betriebssystem und nimmt die
  // theme-color an. Bleibt sie grün, schneidet sie die helle Inhaltsfläche beim
  // Hochscrollen oben ab. Deshalb wandert die Farbe mit: oben Petrol, passend
  // zum Kopf; sobald die Inhaltsfläche den oberen Rand erreicht, wechselt sie
  // auf denselben Hellton. Dann ist an keiner Scrollposition eine Kante zu
  // sehen. Beim Verlassen der Seite wird wieder Petrol gesetzt.
  useEffect(() => {
    const marke = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!marke) return;

    const PETROL = "#007873";
    const HELL = "#f7f7f4";
    let letzte = "";

    const faerben = () => {
      const wunsch = window.scrollY > 150 ? HELL : PETROL;
      if (wunsch === letzte) return;
      letzte = wunsch;
      marke.setAttribute("content", wunsch);
    };

    faerben();
    window.addEventListener("scroll", faerben, { passive: true });
    return () => {
      window.removeEventListener("scroll", faerben);
      marke.setAttribute("content", PETROL);
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
