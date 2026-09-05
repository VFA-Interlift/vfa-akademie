import "server-only";

/**
 * Wie Dateien aus der App ausgeliefert werden — eine Wahrheit für alle Routen,
 * die ein PDF oder ein Bild zurückgeben.
 *
 * Seit dem 05.09.2026 ist „ansehen" der Normalfall: Tobis Ansage war, dass ein
 * Zertifikat direkt in der Leseansicht des Geräts aufgehen soll (Blättern,
 * Zoomen, Teilen, Sichern) statt in einem nachgebauten Kasten in der App. Dafür
 * muss die Kopfzeile `inline` sagen — bei `attachment` legt jeder Browser die
 * Datei stattdessen in den Ordner „Downloads".
 *
 * Bis dahin stand hier `attachment`, und die App holte die Datei per fetch,
 * baute daraus eine Blob-Adresse und zeigte sie in einem eigenen Vollbild mit
 * eingebettetem Rahmen. Auf dem iPhone zeigte dieser Rahmen nur die starre
 * erste Seite — mehrseitige Dokumente waren ab Seite zwei nicht erreichbar.
 */
export function dateiKopfzeile(dateiname: string, ansehen = true): string {
  const art = ansehen ? "inline" : "attachment";
  // RFC 5987: Umlaute und Leerzeichen im Dateinamen sicher kodieren.
  return `${art}; filename*=UTF-8''${encodeURIComponent(dateiname).replace(/['()]/g, escape)}`;
}

/** Maskiert Text, der in die Fehlerseite gesetzt wird. */
function maskiert(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Eine lesbare Fehlerseite statt einer nackten JSON-Zeile.
 *
 * Nötig, seit die Dateirouten in einem eigenen Tab aufgehen: Dort landet der
 * Nutzer bei einem Fehler direkt auf der Antwort der Route und sähe sonst
 * `{"ok":false,"error":"..."}`.
 *
 * Der Text wird maskiert. Heute übergibt jede Route eine feste Zeichenkette,
 * aber die Funktion steht allen offen — der nächste Aufrufer mit einem
 * Dateinamen oder einer Fehlermeldung darin brächte sonst ein Loch mit
 * (Gegenprüfung 05.09.2026).
 */
export function fehlerSeite(text: string, status: number): Response {
  const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dokument nicht verfügbar</title>
<style>
  body { margin: 0; display: grid; place-items: center; min-height: 100vh;
         font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
         background: #F7F7F4; color: #1F1F1F; padding: 24px; }
  .kasten { max-width: 420px; text-align: center; background: #FFFFFF;
            border: 1px solid #E4E4DE; border-radius: 14px; padding: 28px 24px; }
  h1 { margin: 0 0 10px; font-size: 17px; color: #007873; }
  p { margin: 0; color: #555555; }
</style>
</head>
<body>
  <div class="kasten">
    <h1>Dokument nicht verfügbar</h1>
    <p>${maskiert(text)}</p>
  </div>
</body>
</html>`;

  return new Response(seite, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
