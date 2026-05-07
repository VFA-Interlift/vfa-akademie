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
  const localPath = path.join(
    process.cwd(),
    "public",
    "certificate-templates",
    templateFileName
  );

  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, "binary");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;

  if (!appUrl) {
    throw new Error(`TEMPLATE_NOT_FOUND: ${templateFileName}`);
  }

  const templateUrl = `${appUrl.replace(/\/$/, "")}/certificate-templates/${encodeURIComponent(
    templateFileName
  )}`;

  const res = await fetch(templateUrl, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TEMPLATE_NOT_FOUND: ${templateFileName}`);
  }

  const arrayBuffer = await res.arrayBuffer();

  return Buffer.from(arrayBuffer).toString("binary");
}