import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pant-renderer-"));
import PdfPrinter from "pdfmake";
import {
  definition,
  sample,
  contentFromMarkdown,
} from "../../client/src/lib/renderizador/document.mjs";
const root = process.cwd() + "/client/public/renderizador/";
const asset = (name) =>
  Buffer.from(
    JSON.parse(fs.readFileSync(root + name + ".json", "utf8")).data,
    "base64",
  );
const font = (name) => {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, asset(name));
  return p;
};
const printer = new PdfPrinter({
  Cormorant: {
    normal: font("regular.ttf"),
    bold: font("bold.ttf"),
    italics: font("italic.ttf"),
    bolditalics: font("italic.ttf"),
  },
});
const meta = {
  patient: "Documento demonstrativo",
  detail: "Exemplo sem dados clínicos",
  title: "Laudo Neuropediátrico",
  subtitle: "Avaliação neuropediátrica",
};
for (const [name, md] of [
  ["sample", sample],
  [
    "long",
    Array.from(
      { length: 14 },
      (_, i) =>
        `## Seção ${i + 1}\n\n` +
        "Texto de teste para verificar continuidade e paginação sem dados clínicos. A informação deve permanecer integral e legível. ".repeat(
          10,
        ),
    ).join("\n\n") +
      "\n\n| Campo | Descrição |\n| --- | --- |\n" +
      Array.from(
        { length: 60 },
        (_, i) => `| Linha ${i + 1} | Informação de teste preservada |`,
      ).join("\n"),
  ],
]) {
  const doc = printer.createPdfKitDocument(
    definition(
      md,
      meta,
      "data:image/png;base64," + asset("brasao.png").toString("base64"),
    ),
  );
  await new Promise((resolve, reject) => {
    const s = fs.createWriteStream("/tmp/pant-" + name + ".pdf");
    doc.pipe(s);
    s.on("finish", resolve);
    s.on("error", reject);
    doc.end();
  });
}
for (const md of [
  "<script>alert(1)</script>",
  "![foto](https://example.com/x.png)",
]) {
  let rejected = false;
  try {
    contentFromMarkdown(md);
  } catch {
    rejected = true;
  }
  if (!rejected) throw Error("Unsupported input accepted");
}
console.log(
  "PDF demonstrativo, documento longo e rejeição de HTML/imagens: OK",
);

fs.rmSync(tmp, { recursive: true });
