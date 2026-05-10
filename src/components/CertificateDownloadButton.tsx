"use client";

import { useState } from "react";

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
        const text = await res.text().catch(() => "");
        setMsg(text || "Download fehlgeschlagen.");
        return;
      }

      const blob = await res.blob();

      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const fileName = getFileNameFromContentDisposition(contentDisposition);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "zertifikat.docx";
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
        }}
      >
        {loading ? "Wird geladen..." : label}
      </button>

      {msg && (
        <div
          style={{
            color: msg.includes("fehlgeschlagen") || msg.includes("konnte")
              ? "#B00020"
              : "#007873",
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