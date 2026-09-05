"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Zählt beim ersten Erscheinen von 0 auf den Zielwert hoch — der kleine
 * Freude-Moment beim Öffnen: die Credits fühlen sich "verdient" an, statt
 * einfach dazustehen. Bewusst nur hier (Dashboard-Ring, Credit-Konto), nicht
 * überall — sonst wird Bewegung beliebig.
 *
 * Respektiert prefers-reduced-motion: dann steht der Zielwert sofort.
 *
 * Der Effekt hängt am Wert, nicht an []: Kommt der erste echte Wert erst nach
 * dem ersten Rendern (z. B. 0 → 410), startet die Animation dann — vorher
 * blieb die Zahl auf 0 stehen („Meine Credits“, Rundgang 05.09.2026). Spätere
 * Änderungen werden ohne erneute Animation übernommen.
 */
export default function AnimatedNumber({
  value,
  durationMs = 1200,
  delayMs = 0,
}: {
  value: number;
  durationMs?: number;
  delayMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    // Noch kein Wert über 0: die Anzeige steht ohnehin auf 0, auf den ersten
    // echten Wert warten.
    if (value <= 0 && !startedRef.current) return;

    const reduziert =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Schon animiert oder Bewegung reduziert: Wert direkt übernehmen (im
    // nächsten Bild, damit kein Zustand synchron im Effekt gesetzt wird).
    const sofort = startedRef.current || reduziert;
    startedRef.current = true;

    if (sofort) {
      const id = window.requestAnimationFrame(() => setDisplay(value));
      return () => window.cancelAnimationFrame(id);
    }

    let rafId = 0;
    let start: number | null = null;

    function tick(ts: number) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) rafId = window.requestAnimationFrame(tick);
    }

    const timeoutId = window.setTimeout(() => {
      rafId = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(rafId);
    };
  }, [value, durationMs, delayMs]);

  return <>{display.toLocaleString("de-DE")}</>;
}
