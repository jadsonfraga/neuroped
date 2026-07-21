import fs from "node:fs";
import path from "node:path";

// Integração idempotente acionada após a criação do catálogo seguro.
const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function insertAfterOnce(content, marker, insertion, label) {
  if (content.includes(insertion.trim())) return content;
  const index = content.indexOf(marker);
  if (index < 0) throw new Error(`[import-uploaded-scales] marcador ausente em ${label}: ${marker}`);
  return `${content.slice(0, index + marker.length)}${insertion}${content.slice(index + marker.length)}`;
}

function replaceOnce(content, from, to, label) {
  if (content.includes(to)) return content;
  const index = content.indexOf(from);
  if (index < 0) throw new Error(`[import-uploaded-scales] trecho ausente em ${label}: ${from.slice(0, 100)}`);
  return `${content.slice(0, index)}${to}${content.slice(index + from.length)}`;
}

function patchFilterableCatalog() {
  const file = "client/src/data/filterableCatalog.ts";
  let content = read(file);
  content = insertAfterOnce(
    content,
    'import type { ScaleEntry } from "@/data/scaleFilter";',
    '\nimport { applyUploadedInstrumentOverrides, uploadedFilterInstruments } from "@/data/uploadedInstrumentCatalog";',
    file,
  );
  content = insertAfterOnce(
    content,
    "export const supplementalFilterableInstruments: ScaleEntry[] = [",
    "\n  ...uploadedFilterInstruments,",
    file,
  );
  content = replaceOnce(
    content,
    "return uniqueById([...primary, ...supplementalFilterableInstruments]).filter(\n    (scale) => !FILTER_EXCLUDED_IDS.has(scale.id),\n  );",
    "return uniqueById([\n    ...primary.map(applyUploadedInstrumentOverrides),\n    ...supplementalFilterableInstruments,\n  ]).filter((scale) => !FILTER_EXCLUDED_IDS.has(scale.id));",
    file,
  );
  write(file, content);
}

function patchAppRoutes() {
  const file = "client/src/App.tsx";
  let content = read(file);
  content = insertAfterOnce(
    content,
    'const GenericScalePage = lazy(() => import("@/pages/generic-scale"));',
    '\nconst InstrumentoImportadoPage = lazy(() => import("@/pages/instrumento-importado"));',
    file,
  );
  content = insertAfterOnce(
    content,
    '            <Route path="/generic-scale/:id" component={GenericScalePage} />',
    '\n            <Route path="/instrumentos-importados/:id" component={InstrumentoImportadoPage} />',
    file,
  );
  write(file, content);
}

function patchCarsPage() {
  const file = "client/src/pages/cars.tsx";
  let content = read(file);
  const replacements = [
    ["Respostas registradas — CARS-2", "Respostas registradas — CARS (15 domínios)"],
    ['scaleName="CARS-2"', 'scaleName="CARS — registro clínico"'],
    ['scaleFullName="Childhood Autism Rating Scale, Second Edition"', 'scaleFullName="Registro descritivo dos 15 domínios da Childhood Autism Rating Scale"'],
    ['<h1 className="text-lg font-bold">CARS-2</h1>', '<h1 className="text-lg font-bold">CARS — registro clínico</h1>'],
    [
      "Childhood Autism Rating Scale, Second Edition — a partir de 2 anos",
      "Registro descritivo de 15 domínios — não equivale à aplicação oficial CARS-2",
    ],
    [
      "<strong>Instruções:</strong> Para cada categoria, selecione a opção",
      "<strong>Instruções:</strong> Registro clínico interno. Para cada categoria, selecione a opção",
    ],
    [
      "O registro final apresenta cada categoria e a descrição selecionada\n             por extenso, sem soma, ponto de corte, classificação ou interpretação.",
      "O registro final apresenta cada categoria e a descrição selecionada\n             por extenso, sem soma, ponto de corte, classificação ou interpretação.\n             A CARS2-ST, CARS2-HF e CARS2-QPC oficiais estão catalogadas separadamente e exigem material licenciado.",
    ],
  ];
  for (const [from, to] of replacements) content = replaceOnce(content, from, to, file);
  // O atributo aparece duas vezes (ClinicalReport e SaveToPatient).
  content = content.replace('scaleName="CARS-2"', 'scaleName="CARS — registro clínico"');
  write(file, content);
}

patchFilterableCatalog();
patchAppRoutes();
patchCarsPage();
console.log("[import-uploaded-scales] integração aplicada com sucesso");
