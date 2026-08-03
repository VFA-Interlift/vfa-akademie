/**
 * Prüft ein neues Passwort. Gilt einheitlich für Registrierung, Zurücksetzen
 * und Ändern — vorher war die einzige Regel „mindestens 8 Zeichen".
 *
 * Bewusst keine Zeichenklassen-Pflicht: Sie treibt Leute zu „Passwort1!" und
 * bringt weniger als Länge. Stattdessen Länge plus die Muster, die in echten
 * Leaks vorne stehen.
 */
const HAEUFIGE_MUSTER = [
  "passwort",
  "password",
  "qwertz",
  "qwerty",
  "12345678",
  "123456789",
  "1234567890",
  "aufzug",
  "akademie",
  "vfa-interlift",
  "interlift",
  "willkommen",
  "geheim",
];

export const PASSWORT_MINDESTLAENGE = 10;

export function passwortFehler(
  passwort: string,
  hinweise: { email?: string | null; name?: string | null } = {}
): string | null {
  const wert = passwort ?? "";

  if (wert.length < PASSWORT_MINDESTLAENGE) {
    return `Das Passwort muss mindestens ${PASSWORT_MINDESTLAENGE} Zeichen haben.`;
  }

  if (wert.length > 200) {
    return "Das Passwort ist zu lang (höchstens 200 Zeichen).";
  }

  const klein = wert.toLowerCase();

  if (HAEUFIGE_MUSTER.some((muster) => klein.includes(muster))) {
    return "Dieses Passwort ist zu leicht zu erraten. Bitte wähle ein anderes.";
  }

  // Nur ein einziges Zeichen, wiederholt.
  if (new Set(wert).size <= 2) {
    return "Das Passwort besteht aus zu wenigen verschiedenen Zeichen.";
  }

  const konto = String(hinweise.email ?? "").split("@")[0].toLowerCase();
  if (konto.length >= 4 && klein.includes(konto)) {
    return "Das Passwort darf nicht deine E-Mail-Adresse enthalten.";
  }

  const vorname = String(hinweise.name ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (vorname.length >= 4 && klein.includes(vorname)) {
    return "Das Passwort darf nicht deinen Namen enthalten.";
  }

  return null;
}
