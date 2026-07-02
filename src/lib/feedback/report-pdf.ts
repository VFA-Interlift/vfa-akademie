import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  lineTo,
  closePath,
  clip,
  endPath,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { AdminFeedbackTraining } from "@/lib/feedback/evaluation";

/**
 * Erzeugt eine kompakte PDF-Auswertung der Schulungs-Feedbacks (mehrere Fragen
 * pro Seite) – analog zum SurveyMonkey-Export, aber dichter. Gezeichnet mit
 * pdf-lib (kein Headless-Browser nötig, damit Vercel-tauglich).
 */
export async function renderFeedbackReportPdf(
  trainings: AdminFeedbackTraining[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const M = 36; // Seitenrand
  const contentW = A4.w - M * 2;

  // Farben
  const TEAL = rgb(0, 120 / 255, 115 / 255);
  const GREEN = rgb(0, 182 / 255, 122 / 255);
  const TRACK = rgb(0.94, 0.94, 0.94);
  const DARK = rgb(0.12, 0.12, 0.12);
  const MUTED = rgb(0.55, 0.55, 0.55);
  const BORDER = rgb(0.9, 0.9, 0.9);
  const WHITE = rgb(1, 1, 1);

  let page: PDFPage = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M; // Cursor von oben

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - M;
  };
  const ensure = (h: number) => {
    if (y - h < M) newPage();
  };

  const widthOf = (t: string, size: number, f: PDFFont = font) => f.widthOfTextAtSize(t, size);

  const text = (
    t: string,
    x: number,
    yy: number,
    size: number,
    opts: { f?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" | "center"; maxW?: number } = {}
  ) => {
    const f = opts.f ?? font;
    let s = sanitize(t);
    if (opts.maxW) s = ellipsize(s, f, size, opts.maxW);
    let x0 = x;
    const w = widthOf(s, size, f);
    if (opts.align === "right") x0 = x - w;
    else if (opts.align === "center") x0 = x - w / 2;
    page.drawText(s, { x: x0, y: yy, size, font: f, color: opts.color ?? DARK });
    return w;
  };

  const wrap = (t: string, f: PDFFont, size: number, maxW: number, maxLines = 2): string[] => {
    const words = sanitize(t).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (widthOf(next, size, f) <= maxW) cur = next;
      else {
        if (cur) lines.push(cur);
        cur = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    // Rest in letzte Zeile, ggf. mit … kürzen
    if (lines.length === maxLines) {
      const consumed = lines.join(" ");
      const remaining = sanitize(t).slice(consumed.length).trim();
      if (remaining) lines[maxLines - 1] = ellipsize(`${lines[maxLines - 1]} ${remaining}`, f, size, maxW);
    }
    return lines.length ? lines : [""];
  };

  const hbar = (x: number, yy: number, w: number, h: number, frac: number, fill: ReturnType<typeof rgb>) => {
    page.drawRectangle({ x, y: yy, width: w, height: h, color: TRACK, borderColor: TRACK, borderWidth: 0 });
    const fw = Math.max(0, Math.min(1, frac)) * w;
    if (fw > 0) page.drawRectangle({ x, y: yy, width: fw, height: h, color: fill });
  };

  const chip = (label: string, x: number, yy: number) => {
    const size = 7.5;
    const w = widthOf(label, size, bold) + 8;
    page.drawRectangle({ x, y: yy - 1.5, width: w, height: 11, color: TEAL, borderWidth: 0 });
    text(label, x + 4, yy + 1, size, { f: bold, color: WHITE });
    return w;
  };

  // 5 Sterne mit anteiliger Füllung (avg/5) via Clipping – wie im Standalone.
  const STAR_PATH =
    "M12 2 L14.9 8.6 L22 9.2 L16.6 13.9 L18.3 21 L12 17.2 L5.7 21 L7.4 13.9 L2 9.2 L9.1 8.6 Z";
  const drawStars = (x: number, bottom: number, avg: number | null, size = 8, gap = 1.5) => {
    if (avg == null) return;
    const scale = size / 24;
    const totalW = 5 * size + 4 * gap;
    const drawRow = (color: ReturnType<typeof rgb>) => {
      for (let i = 0; i < 5; i++) {
        page.drawSvgPath(STAR_PATH, { x: x + i * (size + gap), y: bottom + size, scale, color, borderWidth: 0 });
      }
    };
    drawRow(rgb(0.85, 0.85, 0.85)); // leere Sterne
    const clipW = Math.max(0, Math.min(1, avg / 5)) * totalW;
    page.pushOperators(
      pushGraphicsState(),
      moveTo(x, bottom),
      lineTo(x + clipW, bottom),
      lineTo(x + clipW, bottom + size),
      lineTo(x, bottom + size),
      closePath(),
      clip(),
      endPath()
    );
    drawRow(GREEN); // gefüllter Anteil
    page.pushOperators(popGraphicsState());
  };

  // ---- Titel ----
  const drawTitle = (titleText: string, subtitle: string) => {
    ensure(46);
    text(titleText, M, y - 15, 17, { f: bold, color: TEAL });
    text(subtitle, M, y - 29, 9.5, { color: MUTED });
    y -= 44;
  };

  // ---- Verteilung je Rating-Frage aus den Einzelabgaben ----
  const distFor = (t: AdminFeedbackTraining, key: string): number[] => {
    const d = [0, 0, 0, 0, 0];
    for (const s of t.submissions) {
      const v = s.answers[key];
      if (typeof v === "number" && v >= 1 && v <= 5) d[v - 1]++;
    }
    return d;
  };

  // ---- Rating-Karte (halbe Breite) ----
  const colGap = 12;
  const colW = (contentW - colGap) / 2;

  const ratingCardHeight = (t: AdminFeedbackTraining, q: AdminFeedbackTraining["questions"][number]) => {
    const labelLines = wrap(q.label, bold, 8, colW - 16 - 18, 2).length; // 18 = Chip-Platz
    return 10 + labelLines * 10 + 6 + 5 * 9 + 8;
  };

  const drawRatingCard = (t: AdminFeedbackTraining, q: AdminFeedbackTraining["questions"][number], x: number, top: number, h: number) => {
    page.drawRectangle({ x, y: top - h, width: colW, height: h, color: WHITE, borderColor: BORDER, borderWidth: 0.7 });
    let cy = top - 12;
    const chipW = chip(qref(q.key, t), x + 8, cy - 2);
    const labelLines = wrap(q.label, bold, 8, colW - 16 - chipW - 4, 2);
    labelLines.forEach((ln, i) => text(ln, x + 8 + chipW + 4, cy - i * 10, 8, { f: bold }));
    cy -= labelLines.length * 10 + 6;

    // Ø-Block links (Zahl + Sterne, wie im Standalone)
    const avg = q.average;
    text(avg != null ? avg.toFixed(2) : "–", x + 10, cy - 14, 16, { f: bold });
    drawStars(x + 10, cy - 28, avg);

    // Verteilung rechts
    const d = distFor(t, q.key);
    const max = Math.max(...d, 1);
    const distX = x + 66;
    const distW = colW - 66 - 22;
    for (let i = 0; i < 5; i++) {
      const ry = cy - 7 - i * 9;
      text(String(i + 1), x + 60, ry, 7, { color: MUTED, align: "right" });
      hbar(distX, ry - 1, distW, 6, d[i] / max, TEAL);
      text(String(d[i]), x + colW - 8, ry, 7, { color: DARK, align: "right" });
    }
  };

  // ---- Volle Breite: Auswahl/Mehrfach ----
  const drawOptionsCard = (q: AdminFeedbackTraining["questions"][number], t: AdminFeedbackTraining, answered: number) => {
    const rows = q.optionCounts;
    const headH = 18;
    const rowH = 12;
    const h = headH + rows.length * rowH + 8;
    ensure(h + 6);
    const top = y;
    page.drawRectangle({ x: M, y: top - h, width: contentW, height: h, color: WHITE, borderColor: BORDER, borderWidth: 0.7 });
    const chipW = chip(qref(q.key, t), M + 8, top - 12);
    text(`${q.label}  (${answered} ${answered === 1 ? "Antwort" : "Antworten"})`, M + 8 + chipW + 4, top - 11, 8.5, { f: bold, maxW: contentW - chipW - 24 });
    let ry = top - headH - 8;
    const barX = M + contentW - 150;
    for (const o of rows) {
      const pct = answered > 0 ? Math.round((o.count / answered) * 100) : 0;
      const on = o.count > 0;
      text(o.option, M + 10, ry, 8, { color: DARK, maxW: barX - M - 18 });
      hbar(barX, ry - 1, 80, 6, pct / 100, on ? TEAL : TRACK);
      text(`${pct}%`, barX + 110, ry, 8, { color: MUTED, align: "right" });
      text(String(o.count), M + contentW - 8, ry, 8, { f: bold, align: "right" });
      ry -= rowH;
    }
    y = top - h - 6;
  };

  // ---- Volle Breite: Freitext ----
  const drawTextCard = (q: AdminFeedbackTraining["questions"][number], t: AdminFeedbackTraining) => {
    const answers = q.textAnswers;
    const lineW = contentW - 20;
    const blocks = (answers.length ? answers : ["Keine Angaben."]).map((a) =>
      wrap(answers.length ? `„${a}“` : a, font, 9, lineW, 4)
    );
    const bodyLines = blocks.reduce((s, b) => s + b.length, 0);
    const h = 18 + bodyLines * 11 + answers.length * 3 + 8;
    ensure(h + 6);
    const top = y;
    page.drawRectangle({ x: M, y: top - h, width: contentW, height: h, color: WHITE, borderColor: BORDER, borderWidth: 0.7 });
    const chipW = chip(qref(q.key, t), M + 8, top - 12);
    text(q.label, M + 8 + chipW + 4, top - 11, 8.5, { f: bold, maxW: contentW - chipW - 24 });
    let ry = top - 26;
    blocks.forEach((b) => {
      b.forEach((ln) => {
        text(ln, M + 10, ry, 9, { color: answers.length ? DARK : MUTED });
        ry -= 11;
      });
      ry -= 3;
    });
    y = top - h - 6;
  };

  // ---- Summary „Auf einen Blick“ (KPIs + Top/Niedrigste) ----
  const drawSummary = (t: AdminFeedbackTraining, ratings: AdminFeedbackTraining["questions"][number][]) => {
    const rated = ratings.filter((q) => q.average != null);
    const avgAll = rated.length ? rated.reduce((s, q) => s + (q.average ?? 0), 0) / rated.length : null;
    const sorted = [...rated].sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
    const best = sorted.slice(0, 3);
    const worst = sorted.slice(-3).reverse();
    const rows = Math.max(best.length, worst.length);

    const headH = 16;
    const kpiH = 34;
    const listH = 12 + rows * 11;
    const h = 8 + headH + kpiH + 10 + listH + 8;
    ensure(h + 6);
    const top = y;
    page.drawRectangle({ x: M, y: top - h, width: contentW, height: h, color: WHITE, borderColor: BORDER, borderWidth: 0.7 });
    const chipW = chip("Ø", M + 8, top - 12);
    text("Auf einen Blick", M + 8 + chipW + 4, top - 11, 9, { f: bold, color: TEAL });

    // KPI-Boxen
    const kpis = [
      [String(t.responseCount), "Teilnehmende"],
      [avgAll != null ? avgAll.toFixed(2) : "–", "Ø über alle Bewertungen"],
      [String(ratings.length), "Bewertungsfragen"],
    ];
    const kpiTop = top - headH - 6;
    const kpiW = (contentW - 16 - 2 * 8) / 3;
    kpis.forEach(([v, l], i) => {
      const kx = M + 8 + i * (kpiW + 8);
      page.drawRectangle({ x: kx, y: kpiTop - kpiH, width: kpiW, height: kpiH, color: rgb(0.98, 0.98, 0.97), borderColor: BORDER, borderWidth: 0.6 });
      text(v, kx + kpiW / 2, kpiTop - 16, 15, { f: bold, color: TEAL, align: "center" });
      text(l, kx + kpiW / 2, kpiTop - 28, 7, { color: MUTED, align: "center", maxW: kpiW - 6 });
    });

    // Top / Niedrigste
    let ly = kpiTop - kpiH - 12;
    const colHalf = (contentW - 16 - 12) / 2;
    text("TOP-BEWERTUNGEN", M + 8, ly, 7.5, { f: bold, color: GREEN });
    text("NIEDRIGSTE BEWERTUNGEN", M + 8 + colHalf + 12, ly, 7.5, { f: bold, color: rgb(0.75, 0.22, 0.17) });
    ly -= 11;
    const drawList = (items: typeof best, x: number) => {
      items.forEach((q, i) => {
        const yy = ly - i * 11;
        text(`F${t.questions.findIndex((z) => z.key === q.key) + 1} ${q.label}`, x, yy, 7.5, { color: DARK, maxW: colHalf - 26 });
        text((q.average ?? 0).toFixed(2), x + colHalf, yy, 7.5, { f: bold, align: "right" });
      });
    };
    drawList(best, M + 8);
    drawList(worst, M + 8 + colHalf + 12);
    y = top - h - 8;
  };

  // ===== Rendern =====
  const single = trainings.length === 1;
  if (single) {
    const t = trainings[0];
    const code = t.displayTitle;
    drawTitle(`Abschluss-Feedback — Schulung ${code}`, `Auswertung · ${t.responseCount} Teilnehmende · Skala 1 (niedrig) – 5 (hoch)`);
  } else {
    drawTitle("Abschluss-Feedback — Auswertung", `${trainings.length} Schulungen · Skala 1 (niedrig) – 5 (hoch)`);
  }

  trainings.forEach((t, ti) => {
    const ratings = t.questions.filter((q) => q.type === "rating");
    const options = t.questions.filter((q) => q.type === "single" || q.type === "multi");
    const texts = t.questions.filter((q) => q.type === "text");

    if (!single) {
      ensure(30);
      if (ti > 0) y -= 2;
      const title = t.displayTitle;
      text(title, M, y - 12, 13, { f: bold, color: DARK, maxW: contentW });
      const meta = `${t.responseCount} ${t.responseCount === 1 ? "Antwort" : "Antworten"} · ${t.formType === "INHOUSE" ? "Inhouse" : "Öffentlich"}`;
      text(meta, M, y - 24, 9, { color: MUTED });
      y -= 30;
    }

    // Übersicht
    drawSummary(t, ratings);

    // Rating-Grid (2 Spalten)
    if (ratings.length) {
      text("BEWERTUNGSFRAGEN", M, y - 8, 8, { f: bold, color: TEAL });
      y -= 16;
    }
    for (let i = 0; i < ratings.length; i += 2) {
      const left = ratings[i];
      const right = ratings[i + 1];
      const hL = ratingCardHeight(t, left);
      const hR = right ? ratingCardHeight(t, right) : 0;
      const rowH = Math.max(hL, hR);
      ensure(rowH + 6);
      const top = y;
      drawRatingCard(t, left, M, top, rowH);
      if (right) drawRatingCard(t, right, M + colW + colGap, top, rowH);
      y = top - rowH - 6;
    }

    if (options.length || texts.length) {
      ensure(20);
      text("AUSWAHLFRAGEN & FREITEXT", M, y - 8, 8, { f: bold, color: TEAL });
      y -= 16;
    }
    const answered = t.responseCount;
    options.forEach((q) => drawOptionsCard(q, t, answered));
    texts.forEach((q) => drawTextCard(q, t));
  });

  return doc.save();
}

/** Fortlaufende Fragennummer „Fx“ anhand der Reihenfolge im Fragenkatalog. */
function qref(key: string, t: AdminFeedbackTraining): string {
  const idx = t.questions.findIndex((q) => q.key === key);
  return idx >= 0 ? `F${idx + 1}` : "F";
}

/** Erlaubte CP1252-Sonderzeichen oberhalb von 0xFF (von WinAnsi unterstützt). */
const CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

/** Ersetzt Zeichen, die WinAnsi/Helvetica nicht kodieren kann (z. B. Emojis). */
function sanitize(input: string): string {
  let out = "";
  for (const ch of String(input ?? "")) {
    const cp = ch.codePointAt(0)!;
    if (cp <= 0xff || CP1252_EXTRA.has(cp)) out += ch;
    else out += ""; // nicht darstellbare Zeichen (Sterne, Emojis) entfernen
  }
  return out.replace(/\r\n|\r/g, " ").replace(/\n/g, " ").replace(/ {2,}/g, " ").trim();
}

function ellipsize(s: string, f: PDFFont, size: number, maxW: number): string {
  if (f.widthOfTextAtSize(s, size) <= maxW) return s;
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (f.widthOfTextAtSize(s.slice(0, mid) + "…", size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return s.slice(0, lo).trimEnd() + "…";
}
