#!/usr/bin/env node
// Publica o banco kawaii autoral do Reconhecimento Visual (recognition-v3).
// Determinístico: regenerar sem mudanças no desenho produz os mesmos bytes, e o
// teste tests/unit/visual-recognition-kawaii.test.ts compara a regeneração com
// os arquivos publicados. Uso: node scripts/build-recognition-kawaii.mjs
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { KAWAII_FIGURES, renderKawaiiSvg } from "./recognition/kawaii-figures.mjs";

export const KAWAII_VERSION = "2026-11-17.3";
export const KAWAII_LICENSE = "LicenseRef-NeuroPed-autoral";

export function buildKawaiiBank() {
  const files = new Map();
  const items = KAWAII_FIGURES.map((figure) => {
    const svg = renderKawaiiSvg(figure.id);
    files.set(`${figure.id}.svg`, svg);
    return {
      id: figure.id,
      category: figure.category,
      label: figure.label,
      minMonths: figure.minMonths,
      sourcePath: `NEUROPED/kawaii/${figure.id}.svg`,
      sha256: createHash("sha256").update(svg).digest("hex"),
      license: KAWAII_LICENSE,
      author: "NeuroPed",
      style: "kawaii",
      review: "illustration-not-normed",
    };
  });
  const manifest = {
    version: KAWAII_VERSION,
    style: "kawaii",
    source: "NeuroPed (ilustrações autorais)",
    generator: "scripts/recognition/kawaii-figures.mjs",
    audience: "Apresentação de 12 a 59 meses (1 a 4 anos). A partir de 5 anos, o padrão é o banco sóbrio recognition-v2.",
    adaptation: "Desenho vetorial autoral: silhueta prototípica grande e centrada, contorno macio e rosto kawaii sobre a superfície maior, sem texto, script, imagem embutida ou referência externa. Rótulos PT-BR são descritores locais, não normas.",
    items,
  };
  files.set("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  files.set("LICENSE.txt", [
    "Banco kawaii do Reconhecimento Visual · NeuroPed",
    "",
    "Ilustrações vetoriais autorais criadas para o aplicativo NeuroPed (2026).",
    "Uso restrito ao aplicativo NeuroPed. Não são estímulos normatizados nem",
    "validados psicometricamente; servem à observação clínica descritiva.",
    "",
  ].join("\n"));
  return files;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = join(fileURLToPath(new URL("..", import.meta.url)), "client/public/recognition-v3");
  mkdirSync(output, { recursive: true });
  const files = buildKawaiiBank();
  for (const name of readdirSync(output)) if (!files.has(name)) rmSync(join(output, name));
  for (const [name, content] of files) writeFileSync(join(output, name), content);
  console.log(`recognition-v3: ${files.size - 2} figuras kawaii publicadas com manifesto e hashes.`);
}
