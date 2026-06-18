import { CertificateKind } from "@prisma/client";

export type CertificateTemplateConfig = {
  code: string;
  label: string;
  kind: CertificateKind;
  templateFileName: string;
  pdfTemplateFileName?: string;
  isVdiCertificate: boolean;
};

export const CERTIFICATE_TEMPLATES: Record<string, CertificateTemplateConfig> = {
  A1: {
    code: "A1",
    label: "VDI 2168 Grundkurs A1",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "VDI2168_A1_Teilnahmebestaetigung.docx",
    pdfTemplateFileName: "VDI2168_A1_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  A2: {
    code: "A2",
    label: "VDI 2168 Kategorie A2",
    kind: "VDI_CERTIFICATE",
    templateFileName: "VDI2168_A2_TN-Zert_VDI.docx",
    pdfTemplateFileName: "VDI2168_A2_TN-Zert_VDI App.pdf",
    isVdiCertificate: true,
  },

  B: {
    code: "B",
    label: "VDI 2168 Kategorie B",
    kind: "VDI_CERTIFICATE",
    templateFileName: "VDI2168_B_TN-Zert_VDI.docx",
    pdfTemplateFileName: "VDI2168_B_TN-Zert_VDI App.pdf",
    isVdiCertificate: true,
  },

  C: {
    code: "C",
    label: "VDI 2168 Kategorie C",
    kind: "VDI_CERTIFICATE",
    templateFileName: "VDI2168_C_TN-Zert_VDI.docx",
    pdfTemplateFileName: "VDI2168_C_TN-Zert_VDI App.pdf",
    isVdiCertificate: true,
  },

  ARB: {
    code: "ARB",
    label: "Grundlegende Sicherheitsanforderungen fuer Arbeiten an Aufzugsanlagen",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "ARB_TN-Zert.docx",
    pdfTemplateFileName: "ARB_TN-Zert App.pdf",
    isVdiCertificate: false,
  },

  AZUBI: {
    code: "AZUBI",
    label: "VFA-Einfuehrungsseminar / Welcome Azubis",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "AZUBI_TN-Best.docx",
    pdfTemplateFileName: "AZUBI_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  BETR: {
    code: "BETR",
    label: "Betreiber-Schulung",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "BETR_TN-Best.dotx",
    pdfTemplateFileName: "BETR_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  BRG: {
    code: "BRG",
    label: "Berechnungen im Aufzugbau",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "BRG_TN-Best-neu.docx",
    pdfTemplateFileName: "BRG_TN-Best App.pdf",
    isVdiCertificate: false,
  },

  DGUV: {
    code: "DGUV",
    label: "Fachkunde im eingeschraenkten Aufgabengebiet nach DGUV 309-011",
    kind: "CERTIFICATE",
    templateFileName: "DGUV-TN-Zert.docx",
    pdfTemplateFileName: "DGUV-TN-Zert. App.pdf",
    isVdiCertificate: false,
  },

  DOK: {
    code: "DOK",
    label: "Dokumentation im Aufzugbau",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "DOK_TN-Zert.docx",
    pdfTemplateFileName: "DOK_TN-Zert App.pdf",
    isVdiCertificate: false,
  },

  EFK2: {
    code: "EFK2",
    label: "Elektrofachkraft fuer festgelegte Taetigkeiten im Aufzugbau",
    kind: "CERTIFICATE",
    templateFileName: "EFK2-Zertifikat_neu.docx",
    pdfTemplateFileName: "EFK2-Zertifikat App.pdf",
    isVdiCertificate: false,
  },

  EINST: {
    code: "EINST",
    label: "Aufzuege fuer Einsteiger",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "EINST-Online_Teilnahmebestaetigung.docx",
    pdfTemplateFileName: "EINST-Online_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  FFPW: {
    code: "FFPW",
    label: "Fachkundige Person fuer die Befreiung von Personen aus Aufzugsanlagen",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "FFPW-Teilnahmebest.docx",
    pdfTemplateFileName: "FFPW-Teilnahmebest. App.pdf",
    isVdiCertificate: false,
  },

  GEF: {
    code: "GEF",
    label: "Fachkundige Person fuer die Erstellung von Gefaehrdungsbeurteilungen",
    kind: "CERTIFICATE",
    templateFileName: "GEF-TN-Zert_neu.docx",
    pdfTemplateFileName: "GEF-TN-Zert._neu App.pdf",
    isVdiCertificate: false,
  },

  MOD: {
    code: "MOD",
    label: "Grundlagen der Modernisierung im Aufzugbau",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "MOD_Teilnahmebestaetigung-aktuell.docx",
    pdfTemplateFileName: "MOD_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  NUR1: {
    code: "NUR1",
    label: "Normen und Richtlinien - Grundlagen zum aktuellen Regelwerk",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "NuR-1_Teilnahmebestaetigung.docx",
    pdfTemplateFileName: "NuR-1_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  NUR2: {
    code: "NUR2",
    label: "Normen und Richtlinien - Neuerungen aus der EN ISO 8100-1/2",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "NuR-2_Teilnahmebestaetigung.docx",
    pdfTemplateFileName: "NuR-2_Teilnahmebestätigung App.pdf",
    isVdiCertificate: false,
  },

  PLG: {
    code: "PLG",
    label: "Aufzugsplanung als Teil der Gebaeudeplanung",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "PLG_neue_TN-Best.docx",
    pdfTemplateFileName: "PLG TN-Best App.pdf",
    isVdiCertificate: false,
  },

  SCHALL: {
    code: "SCHALL",
    label: "Schallschutz an Aufzugsanlagen",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "SCHALL_TN-Best.docx",
    pdfTemplateFileName: "SCHALL_TN-Best App.pdf",
    isVdiCertificate: false,
  },

  "SER-SWB": {
    code: "SER-SWB",
    label: "Inbetriebnahme einer Aufzugsanlage",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "SER-SWB_TN-Bestaetigung.docx",
    isVdiCertificate: false,
  },

  SICH: {
    code: "SICH",
    label: "Fachkundige Person fuer DGUV V3-Messungen an Aufzugsanlagen",
    kind: "CERTIFICATE",
    templateFileName: "SICH_TN-Zert.docx",
    isVdiCertificate: false,
  },

  SON: {
    code: "SON",
    label: "Sonderanlagen: Feuerwehr-, Lasten- und Glasaufzuege",
    kind: "ATTENDANCE_CONFIRMATION",
    templateFileName: "SON-TN-Bestaetigung.docx",
    pdfTemplateFileName: "SON-TN-Bestätigung App.pdf",
    isVdiCertificate: false,
  },
};

export const CERTIFICATE_TEMPLATE_CODES = Object.keys(CERTIFICATE_TEMPLATES);

export function normalizeCertificateCode(code: string | null | undefined) {
  return String(code ?? "").trim().toUpperCase();
}

export function getCertificateTemplateByCode(
  code: string | null | undefined
): CertificateTemplateConfig | null {
  const normalizedCode = normalizeCertificateCode(code);

  if (!normalizedCode) return null;

  return CERTIFICATE_TEMPLATES[normalizedCode] ?? null;
}

export function getCertificateKindByCode(
  code: string | null | undefined
): CertificateKind | null {
  return getCertificateTemplateByCode(code)?.kind ?? null;
}

export function getCertificateLabelByCode(
  code: string | null | undefined
): string | null {
  return getCertificateTemplateByCode(code)?.label ?? null;
}

export function getCertificateTemplateFileNameByCode(
  code: string | null | undefined
): string | null {
  return getCertificateTemplateByCode(code)?.templateFileName ?? null;
}

export function formatCertificateKind(
  kind: CertificateKind | string | null | undefined
) {
  if (kind === "ATTENDANCE_CONFIRMATION") return "Teilnahmebestätigung";
  if (kind === "CERTIFICATE") return "Zertifikat";
  if (kind === "VDI_CERTIFICATE") return "VDI-Zertifikat";

  return "Zertifikat";
}