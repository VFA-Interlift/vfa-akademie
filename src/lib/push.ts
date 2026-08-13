import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Web Push für die VFA-Akademie-App.
 *
 * Das VAPID-Schlüsselpaar (der Ausweis, mit dem sich unser Server beim
 * Push-Dienst von Apple/Google ausweist) wird beim ersten Bedarf erzeugt und
 * in der Datenbank abgelegt — bewusst kein Umweg über Umgebungsvariablen,
 * damit die Einrichtung ohne Zugriff aufs Vercel-Dashboard auskommt. Wer die
 * Schlüssel je tauschen muss: Zeile aus WebPushSchluessel löschen, alle
 * PushAbos löschen, Nutzer aktivieren neu.
 */
const KONTAKT = "mailto:akademie@vfa-interlift.de";

let imSpeicher: { publicKey: string; privateKey: string } | null = null;

export async function holeVapid() {
  if (imSpeicher) return imSpeicher;

  let zeile = await prisma.webPushSchluessel.findUnique({ where: { id: 1 } });
  if (!zeile) {
    const paar = webpush.generateVAPIDKeys();
    // upsert statt create: Zwei gleichzeitige erste Aufrufe (Cron + Nutzer)
    // dürfen sich nicht gegenseitig einen doppelten Schlüssel anlegen.
    zeile = await prisma.webPushSchluessel.upsert({
      where: { id: 1 },
      create: { id: 1, publicKey: paar.publicKey, privateKey: paar.privateKey },
      update: {},
    });
  }

  imSpeicher = { publicKey: zeile.publicKey, privateKey: zeile.privateKey };
  return imSpeicher;
}

export type PushInhalt = {
  titel: string;
  text: string;
  url?: string;
};

/**
 * Schickt eine Mitteilung an alle Geräte eines Nutzers. Abos, deren Endpunkt
 * der Push-Dienst als verschwunden meldet (404/410 — App gelöscht, Erlaubnis
 * entzogen), werden dabei gelöscht. Gibt die Zahl der erfolgreich
 * zugestellten Mitteilungen zurück.
 */
export async function sendePushAnNutzer(userId: string, inhalt: PushInhalt) {
  const abos = await prisma.pushAbo.findMany({ where: { userId } });
  if (abos.length === 0) return 0;

  const vapid = await holeVapid();
  webpush.setVapidDetails(KONTAKT, vapid.publicKey, vapid.privateKey);

  let zugestellt = 0;
  for (const abo of abos) {
    try {
      await webpush.sendNotification(
        { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
        JSON.stringify(inhalt),
        { TTL: 60 * 60 * 12 }
      );
      zugestellt += 1;
    } catch (fehler) {
      const status = (fehler as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushAbo.delete({ where: { id: abo.id } }).catch(() => {});
      }
      // Andere Fehler (Zeitüberschreitung, Dienst kurz weg) still lassen —
      // der nächste Cron-Lauf versucht es wieder.
    }
  }
  return zugestellt;
}
