import "server-only";
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * Liefert eine Datei aus dem Blob-Speicher aus, nachdem die aufrufende Route die
 * Berechtigung geprüft hat.
 *
 * Hintergrund: Nachweise, unterschriebene Teilnehmerlisten und Mailanhänge lagen
 * bis August 2026 öffentlich im Speicher — wer die Adresse hatte, kam ohne
 * Anmeldung an eingescannte Unterschriften und Klarnamen. Neue Dateien werden
 * privat abgelegt und nur noch über Routen wie diese ausgeliefert.
 *
 * Der Rückfall auf die gespeicherte Adresse ist für die Altbestände nötig: die
 * wurden öffentlich hochgeladen und lassen sich nicht nachträglich umstellen.
 */
export async function dateiAusBlob({
  pathname,
  fallbackUrl,
  dateiname,
}: {
  pathname: string | null | undefined;
  fallbackUrl: string | null | undefined;
  dateiname?: string | null;
}) {
  const kopf = (contentType: string | null) => {
    const headers = new Headers();
    headers.set("Content-Type", contentType || "application/octet-stream");
    headers.set("Cache-Control", "private, no-store");
    if (dateiname) {
      headers.set(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(dateiname)}`
      );
    }
    return headers;
  };

  if (pathname) {
    try {
      const treffer = await get(pathname, { access: "private" });
      if (treffer?.stream) {
        return new NextResponse(treffer.stream, {
          headers: kopf(treffer.headers.get("content-type")),
        });
      }
    } catch {
      // Datei stammt aus der Zeit der öffentlichen Ablage → Rückfall unten.
    }
  }

  if (fallbackUrl) {
    try {
      const res = await fetch(fallbackUrl, { cache: "no-store" });
      if (res.ok && res.body) {
        return new NextResponse(res.body, {
          headers: kopf(res.headers.get("content-type")),
        });
      }
    } catch {
      // fällt unten auf 404
    }
  }

  return NextResponse.json({ ok: false, error: "DATEI_NICHT_GEFUNDEN" }, { status: 404 });
}
