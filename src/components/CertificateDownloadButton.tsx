import AppButton from "@/components/ui/AppButton";

/**
 * Öffnet ein Zertifikat in der Leseansicht des Geräts.
 *
 * Seit dem 05.09.2026 ein gewöhnlicher Link in einen neuen Tab (Tobis Ansage:
 * „bitte direkt diese Leseansicht öffnen"). Die Route liefert das PDF mit
 * `inline` aus, den Rest macht der Browser: Blättern, Zoom, Teilen, Sichern.
 *
 * Was dabei weggefallen ist: das Holen der Datei per fetch, die Blob-Adresse,
 * das nachgebaute Vollbild und die Fehlermeldung darunter. Fehler zeigt jetzt
 * die Route selbst als lesbare Seite — sie ist die einzige Stelle, die weiß,
 * was schiefging, und der Nutzer steht ohnehin schon im neuen Tab.
 *
 * Bewusst kein Klick-Handler mit fetch davor: Auf dem iPhone gilt ein Fenster,
 * das erst nach einem `await` geöffnet wird, nicht mehr als Folge der
 * Berührung — Safari blockt es dann als Pop-up.
 */
export default function CertificateDownloadButton({
  certificateId,
  label = "Dokument ansehen",
}: {
  certificateId: string;
  label?: string;
}) {
  return (
    <AppButton href={`/api/certificates/${certificateId}/download`} external>
      {label}
    </AppButton>
  );
}
