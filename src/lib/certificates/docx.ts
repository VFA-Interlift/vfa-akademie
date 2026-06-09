import fs from "node:fs";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export async function renderCertificateDocx({
  templateFileName,
  data,
}: {
  templateFileName: string;
  data: Record<string, string>;
}) {
  const content = await loadTemplate(templateFileName);

  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });

  doc.render(data);

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

async function loadTemplate(templateFileName: string) {
  const localTemplate = loadTemplateFromFileSystem(templateFileName);

  if (localTemplate) {
    return localTemplate;
  }

  const remoteTemplate = await loadTemplateFromRemote(templateFileName);

  if (remoteTemplate) {
    return remoteTemplate;
  }

  throw new Error(`TEMPLATE_NOT_FOUND: ${templateFileName}`);
}

function loadTemplateFromFileSystem(templateFileName: string) {
  const candidates = [
    path.join(
      process.cwd(),
      "public",
      "certificate-templates",
      templateFileName
    ),
    path.join(
      process.cwd(),
      "src",
      "lib",
      "certificates",
      "templates",
      templateFileName
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "binary");
    }
  }

  return null;
}

async function loadTemplateFromRemote(templateFileName: string) {
  const urls = buildTemplateUrls(templateFileName);

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        continue;
      }

      const arrayBuffer = await res.arrayBuffer();

      return Buffer.from(arrayBuffer).toString("binary");
    } catch {
      continue;
    }
  }

  return null;
}

function buildTemplateUrls(templateFileName: string) {
  const bases = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "https://vfa-akademie.vercel.app",
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ""));

  const uniqueBases = Array.from(new Set(bases));

  return uniqueBases.map((base) => {
    return `${base}/certificate-templates/${encodeURIComponent(
      templateFileName
    )}`;
  });
}