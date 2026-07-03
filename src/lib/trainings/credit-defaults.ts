/**
 * Standard-Credits je Kurskürzel (synchron zu den Cobra-Sync-Regeln in
 * sync-trainings#deriveCredits). Wird für Website-Kurse genutzt, die (noch)
 * nicht in der App-DB stehen bzw. beim Website-Sync neu angelegt werden.
 */
const DEFAULT_CREDITS_BY_PREFIX: [string, number][] = [
  ["IN/SER/TR", 350],
  ["AZUBI", 20],
  ["EINST", 100],
  ["SCHALL", 150],
  ["BETR", 50],
  ["EFK", 250],
  ["A1", 150],
  ["A2", 150],
  ["PLG", 150],
  ["NUR", 50],
  ["DOK", 100],
  ["SON", 100],
  ["MVO", 100],
  ["MOD", 100],
  ["BRG", 150],
  ["GEF", 150],
  ["FRQ", 100],
  ["B", 200],
  ["C", 200],
];

export function defaultCreditsFor(code: string | null): number {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return 0;
  for (const [prefix, credits] of DEFAULT_CREDITS_BY_PREFIX) {
    if (prefix.length === 1) {
      // Einbuchstabige Kürzel (B/C) nur exakt bzw. mit „-" matchen.
      if (normalized === prefix || normalized.startsWith(`${prefix}-`)) return credits;
    } else if (normalized.startsWith(prefix)) {
      return credits;
    }
  }
  return 0;
}
