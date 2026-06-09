"use client";

import { useState } from "react";

type DownloadErrorResponse = {
  ok?: false;
  error?: string;
  message?: string;
  details?: unknown;
};

export default function CertificateDownloadButton({
  certificateId,
  label = "Dokument herunterladen",
}: {
  certificateId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function downloadDocument() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/certificates/${certificateId}/download`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const errorMessage = await getDownloadErrorMessage(res);
        setMsg(errorMessage);
        return;
      }

      const blob = await res.blob();

      if (blob.size === 0) {
        setMsg("Das Dokument ist leer und konnte nicht heruntergeladen werden.");
        return;
      }

      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const fileName =
        getFileNameFromContentDisposition(contentDisposition) ??
        "zertifikat.docx";

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMsg("Download gestartet.");
    } catch {
      setMsg("Download konnte nicht gestartet werden.");
    } finally {
      setLoading(false);
    }
  }

  const isError =
    msg.includes("fehlgeschlagen") ||
    msg.includes("konnte") ||
    msg.includes("nicht") ||
    msg.includes("fehlt") ||
    msg.includes("keine Berechtigung");

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={downloadDocument}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 42,
          padding: "10px 18px",
          borderRadius: 999,
          border: "none",
          background: "#007873",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        {loading ? "Dokument wird erstellt..." : label}
      </button>

      {msg && (
        <div
          style={{
            color: isError ? "#B00020" : "#007873",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.4,
          }}
        >
          {msg}
        </div>
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

  const text = await res.text().catch(() => "");

  if (text.trim()) {
    return text;
  }

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