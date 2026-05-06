import fs from "node:fs";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export function renderCertificateDocx({
  templateFileName,
  data,
}: {
  templateFileName: string;
  data: Record<string, string>;
}) {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "certificate-templates",
    templateFileName
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`TEMPLATE_NOT_FOUND: ${templateFileName}`);
  }

  const content = fs.readFileSync(templatePath, "binary");

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