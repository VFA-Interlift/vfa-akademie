"use client";

import { useEffect, useState } from "react";
import PdfOverlay from "@/components/PdfOverlay";
import AppButton from "@/components/ui/AppButton";
import Meldung from "@/components/ui/Meldung";

type DownloadErrorResponse = {
  ok?: false;
  error?: string;
  message?: string;
  details?: unknown;
};

export default function CertificateDownloadButton({
  certificateId,
  label = "Dokument ansehen",
}: {
  certificateId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  // Eigener Zustand statt Wortsuche im Text: Vorher wurden Fehler ohne
  // Schlüsselwort („Bitte melde dich an …“) grün wie ein Erfolg gezeigt
  // (Befund d07-35, 05.09.2026).
  const [istFehler, setIstFehler] = useState(false);
  const [ansicht, setAnsicht] = useState<{ url: string; dateiname: string } | null>(null);

  // Blob-URL freigeben, sobald die Ansicht zu ist (und beim Abbau der Komponente).
  useEffect(() => {
    return () => {
      if (ansicht) window.URL.revokeObjectURL(ansicht.url);
    };
  }, [ansicht]);

  function fehler(text: string) {
    setIstFehler(true);
    setMsg(text);
  }

  async function downloadDocument() {
    setLoading(true);
    setMsg("");
    setIstFehler(false);

    try {
      const res = await fetch(`/api/certificates/${certificateId}/download`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        fehler(await getDownloadErrorMessage(res));
        return;
      }

      const blob = await res.blob();

      if (blob.size === 0) {
        fehler("Das Dokument ist leer und konnte nicht heruntergeladen werden.");
        return;
      }

      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const fileName =
        getFileNameFromContentDisposition(contentDisposition) ??
        "zertifikat.pdf";

      const url = window.URL.createObjectURL(blob);

      // PDFs bleiben in der App: Vollbild-Ansicht mit X zurueck (Tobi,
      // 12.08.2026). Nur was kein PDF ist (alte docx-Strecke), geht weiter
      // in den Download.
      const istPdf =
        blob.type.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

      if (istPdf) {
        setAnsicht({ url, dateiname: fileName });
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMsg("Download gestartet.");
    } catch {
      fehler("Das Dokument konnte nicht geöffnet werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <AppButton onClick={downloadDocument} disabled={loading}>
        {loading ? "Dokument wird erstellt…" : label}
      </AppButton>

      {msg && <Meldung art={istFehler ? "fehler" : "erfolg"}>{msg}</Meldung>}

      {ansicht && (
        <PdfOverlay
          url={ansicht.url}
          titel="Dein Zertifikat"
          dateiname={ansicht.dateiname}
          onClose={() => {
            window.URL.revokeObjectURL(ansicht.url);
            setAnsicht(null);
          }}
        />
      )}
    </div>
  );
}

async function getDownloadErrorMessage(res: Response) {
  const contentType = res.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as
      | DownloadErrorResponse
      | null;

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return translateDownloadError(data.error);
    }
  }

  // Kein JSON (HTML-Fehlerseite, Zeitüberschreitung des Hosters): nicht den
  // rohen Seitentext zeigen (Befund f11-9, 05.09.2026).
  return "Download fehlgeschlagen.";
}

function translateDownloadError(error: string) {
  if (error === "UNAUTHENTICATED") {
    return "Bitte melde dich an, um das Dokument herunterzuladen.";
  }

  if (error === "FORBIDDEN") {
    return "Du hast keine Berechtigung, dieses Zertifikat herunterzuladen.";
  }

  if (error === "CERTIFICATE_NOT_FOUND") {
    return "Das Zertifikat wurde nicht gefunden.";
  }

  if (error === "CERTIFICATE_NOT_DOWNLOADABLE") {
    return "Dieses Zertifikat ist aktuell nicht für den Download freigegeben.";
  }

  if (error === "CERTIFICATE_TEMPLATE_NOT_CONFIGURED") {
    return "Für diesen Zertifikatstyp ist noch keine Vorlage hinterlegt.";
  }

  if (error === "TEMPLATE_NOT_FOUND") {
    return "Die hinterlegte Zertifikatsvorlage wurde nicht gefunden.";
  }

  if (error === "CERTIFICATE_RENDER_FAILED") {
    return "Das Zertifikat konnte nicht erstellt werden.";
  }

  return "Download fehlgeschlagen.";
}

function getFileNameFromContentDisposition(value: string) {
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const normalMatch = value.match(/filename="?([^"]+)"?/i);

  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return null;
}
