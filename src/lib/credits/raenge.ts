/**
 * Die Rangleiter der Akademie — eine Wahrheit für die ganze App.
 *
 * Bis zum 05.09.2026 stand sie viermal im Code: im Dashboard, auf der
 * Badges-Seite, im Kompetenzpass und in einer Datei, die niemand mehr
 * benutzte. Vier Kopien der Schwellen heißt: Wer sie ändert, findet drei
 * davon und übersieht die vierte. Hier stehen Schlüssel, Beschriftung und
 * Schwelle; Farben, Siegelbilder und Beiwörter bleiben bei den Seiten, weil
 * jede sie anders braucht (flächig, als Siegel, als Dokumentzeile).
 *
 * Bronze beginnt erst bei 100 Credits — das ist eine abgeschlossene
 * Standardschulung. Darunter hat man noch keinen Rang.
 */

export type RangSchluessel = "STARTER" | "BRONZE" | "SILBER" | "GOLD" | "EXPERTE";

export type Rang = {
  key: RangSchluessel;
  /** Wie er in der Oberfläche heißt. */
  label: string;
  /** Ab wie vielen Credits er gilt. */
  min: number;
  /** Bis wie vielen Credits — null heißt: höchster Rang. */
  max: number | null;
};

/** Die vier erreichbaren Ränge, aufsteigend. Ohne den Zustand „kein Rang". */
export const RAENGE: Rang[] = [
  { key: "BRONZE", label: "Bronze", min: 100, max: 499 },
  { key: "SILBER", label: "Silber", min: 500, max: 1499 },
  { key: "GOLD", label: "Gold", min: 1500, max: 3499 },
  { key: "EXPERTE", label: "VFA-Experte", min: 3500, max: null },
];

/** Der Zustand vor dem ersten Rang. */
export const OHNE_RANG: Rang = { key: "STARTER", label: "Kein Rang", min: 0, max: 99 };

/** Alle Stufen einschließlich „kein Rang", aufsteigend — für Leitern und Listen. */
export const RANGLEITER: Rang[] = [OHNE_RANG, ...RAENGE];

/** Der Rang zu einem Punktestand. */
export function rangFuer(credits: number): Rang {
  for (let i = RAENGE.length - 1; i >= 0; i--) {
    if (credits >= RAENGE[i].min) return RAENGE[i];
  }
  return OHNE_RANG;
}

/** Der nächsthöhere Rang — null, wenn die höchste Stufe erreicht ist. */
export function naechsterRang(credits: number): Rang | null {
  return RAENGE.find((r) => credits < r.min) ?? null;
}

/**
 * Fortschritt innerhalb der aktuellen Stufe.
 *
 * Bewusst abgerundet: Gerundet stand der Ring schon auf 100 %, bevor der Rang
 * wirklich erreicht war (Befund 20.08.2026).
 */
export function rangFortschritt(credits: number): { percent: number; remainingToNext: number } {
  const naechster = naechsterRang(credits);
  if (!naechster) return { percent: 100, remainingToNext: 0 };

  const aktuell = rangFuer(credits);
  const spanne = naechster.min - aktuell.min;
  const erreicht = credits - aktuell.min;
  return {
    percent: Math.floor((erreicht / spanne) * 100),
    remainingToNext: naechster.min - credits,
  };
}
