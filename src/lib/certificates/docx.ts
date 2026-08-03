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
  const content = loadTemplate(templateFileName);

  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: "{{",
      end: "}}",
    },
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

/**
 * Word-Vorlagen liegen wie die PDF-Vorlagen außerhalb von `public/`, damit sie
 * nicht öffentlich abrufbar sind. Der frühere Rückfall über eine HTTP-Abfrage
 * der eigenen Adresse ist entfallen — er setzte genau das voraus.
 */
function loadTemplate(templateFileName: string) {
  const kandidaten = [
    path.join(process.cwd(), "src", "lib", "certificates", "pdf-vorlagen", templateFileName),
    path.join(process.cwd(), "src", "lib", "certificates", "templates", templateFileName),
  ];

  for (const kandidat of kandidaten) {
    if (fs.existsSync(kandidat)) {
      return fs.readFileSync(kandidat, "binary");
    }
  }

  throw new Error(`TEMPLATE_NOT_FOUND: ${templateFileName}`);
}