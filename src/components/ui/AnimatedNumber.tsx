"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Zählt beim ersten Erscheinen von 0 auf den Zielwert hoch — der kleine
 * Freude-Moment beim Öffnen: die Credits fühlen sich "verdient" an, statt
 * einfach dazustehen. Bewusst nur hier (Dashboard-Ring, Credit-Konto), nicht
 * überall — sonst wird Bewegung beliebig.
 *
 * Respektiert prefers-reduced-motion: dann steht der Zielwert sofort.
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
    if (startedRef.current) {
      // Spätere Wertänderungen ohne erneute Animation übernehmen.
      setDisplay(value);
      return;
    }
    startedRef.current = true;

    const reduziert =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduziert || value <= 0) {
      setDisplay(value);
      return;
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
    // Nur beim ersten Mount animieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{display.toLocaleString("de-DE")}</>;
}
