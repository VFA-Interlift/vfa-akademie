import "server-only";

/**
 * Einfache Zugriffsbremse für Anmelde- und Kontowege.
 *
 * Bewusst im Arbeitsspeicher und ohne Zusatzdienst: Auf Vercel lebt jede
 * Instanz für sich, die Bremse wirkt also je Instanz und wird beim Neustart
 * zurückgesetzt. Das genügt gegen das Durchprobieren von Passwörtern, ersetzt
 * aber keinen zentralen Zähler, wenn die App später mehrere Regionen bedient.
 *
 * Vorher gab es gar nichts: Login, Registrierung, Passwortwege und die
 * Kontolöschung ließen sich beliebig oft aufrufen — letztere antwortet
 * unterschiedlich, je nachdem ob das Passwort stimmte.
 */
type Eintrag = { treffer: number; fensterBis: number; sperreBis: number };

const speicher = new Map<string, Eintrag>();

/** Aufräumen, damit der Speicher bei vielen Adressen nicht unbegrenzt wächst. */
function aufraeumen(jetzt: number) {
  if (speicher.size < 5000) return;
  for (const [schluessel, eintrag] of speicher) {
    if (eintrag.fensterBis < jetzt && eintrag.sperreBis < jetzt) speicher.delete(schluessel);
  }
}

export type BremsErgebnis = { erlaubt: true } | { erlaubt: false; sekunden: number };

export function bremsePruefen(
  schluessel: string,
  { versuche, fensterSekunden, sperreSekunden }: {
    versuche: number;
    fensterSekunden: number;
    sperreSekunden: number;
  }
): BremsErgebnis {
  const jetzt = Date.now();
  aufraeumen(jetzt);

  const eintrag = speicher.get(schluessel);

  if (eintrag && eintrag.sperreBis > jetzt) {
    return { erlaubt: false, sekunden: Math.ceil((eintrag.sperreBis - jetzt) / 1000) };
  }

  if (!eintrag || eintrag.fensterBis < jetzt) {
    speicher.set(schluessel, {
      treffer: 1,
      fensterBis: jetzt + fensterSekunden * 1000,
      sperreBis: 0,
    });
    return { erlaubt: true };
  }

  eintrag.treffer += 1;

  if (eintrag.treffer > versuche) {
    eintrag.sperreBis = jetzt + sperreSekunden * 1000;
    eintrag.treffer = 0;
    eintrag.fensterBis = jetzt + fensterSekunden * 1000;
    return { erlaubt: false, sekunden: sperreSekunden };
  }

  return { erlaubt: true };
}

/** Nach erfolgreichem Versuch den Zähler zurücksetzen. */
export function bremseZuruecksetzen(schluessel: string) {
  speicher.delete(schluessel);
}

/**
 * Absenderkennung aus den Weiterleitungs-Kopfzeilen. Auf Vercel setzt die
 * Plattform `x-forwarded-for` selbst; der erste Eintrag ist die echte Adresse.
 */
export function absender(req: Request): string {
  const weitergeleitet = req.headers.get("x-forwarded-for");
  if (weitergeleitet) return weitergeleitet.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unbekannt";
}
