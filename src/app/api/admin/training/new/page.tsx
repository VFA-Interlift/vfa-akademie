"use client";

import { useState } from "react";

export default function NewTrainingPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(""); // TT.MM.JJJJ
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setLink(null);

    const res = await fetch("/api/admin/create-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Fehler beim Anlegen.");
      return;
    }

    setMsg("Training erstellt ✅");
    setLink(`/training/${data.trainingId}`);
    setTitle("");
    setDate("");
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Training anlegen
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Titel (z.B. Grundkurs A1-2601)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Datum (TT.MM.JJJJ)
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="23.01.2026"
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <button disabled={loading} style={{ padding: 12, fontWeight: 700 }}>
          {loading ? "…" : "Erstellen"}
        </button>
      </form>

      {msg && (
        <div style={{ marginTop: 16, padding: 10, border: "1px solid #999", borderRadius: 6 }}>
          {msg}
        </div>
      )}

      {link && (
        <div style={{ marginTop: 12 }}>
          QR-Seite: <a href={link}>{link}</a>
        </div>
      )}
    </main>
  );
}
