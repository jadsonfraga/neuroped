import { access, readdir, readFile } from "node:fs/promises";

const checks = [];

async function read(path) {
  return readFile(path, "utf8");
}

function assertCheck(label, condition, detail) {
  checks.push({ label, passed: condition, detail });
}

const nesploraHtml = await read("client/public/nesplora/index.html");
const nesploraReadme = await read("client/public/nesplora/README.md");
const integrationPage = await read("client/src/pages/manus-integracoes.tsx");
const integrationManifest = await read("client/src/data/integrations.ts");
const navigation = await read("client/src/data/navigation.ts");
const syncScript = await read("scripts/sync-nesplora-static.mjs");
const bundleFiles = await readdir("client/public/nesplora/assets");
const bundleText = (
  await Promise.all(
    bundleFiles
      .filter((file) => /\.(?:js|css)$/i.test(file))
      .map((file) => read(`client/public/nesplora/assets/${file}`)),
  )
).join("\n");

for (const pattern of [
  /manus-analytics\.com/i,
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /manus\.space/i,
  /manus-runtime/i,
  /debug-collector/i,
]) {
  assertCheck(
    `Nesplora sem dependência ${pattern.source}`,
    !pattern.test(nesploraHtml),
    "O HTML publicado não deve chamar o domínio externo.",
  );
}

assertCheck(
  "Nesplora com assets locais",
  /\.\/assets\//.test(nesploraHtml) && /media\//.test(nesploraReadme),
  "A entrada e a documentação apontam para o pacote local.",
);
assertCheck(
  "Bundles Nesplora sem runtime Manus",
  !/manus-runtime|debug-collector|manus-storage|manus-analytics|manus\.space|VITE_MANUS_INSTITUCIONAL_URL/i.test(
    bundleText,
  ),
  "JavaScript e CSS versionados não devem carregar runtime, analytics ou storage externo.",
);
assertCheck(
  "Manifesto com cinco experiências incorporadas",
  ["secretaria", "missao", "nesplora", "video-eeg", "institucional"].every(
    (id) => integrationManifest.includes(`id: \"${id}\"`),
  ) && integrationPage.includes("integratedExperiences"),
  "O manifesto possui Secretaria, Missão Saúde, Nesplora, Vídeo-EEG e Institucional.",
);
assertCheck(
  "Hub sem URL institucional Manus",
  !/manus\.space|VITE_MANUS_INSTITUCIONAL_URL/i.test(integrationPage),
  "A página institucional usa uma rota local do NeuroPed.",
);
assertCheck(
  "Navegação com acesso persistente",
  navigation.includes('href: "/manus"') &&
    navigation.includes('href: "/nesplora/"'),
  "As duas entradas permanecem encontráveis no menu.",
);
assertCheck(
  "Sincronizador remove dependências futuras",
  /manus-analytics|fonts\.googleapis|fonts\.gstatic/.test(syncScript),
  "O sincronizador remove tags externas quando um novo build é importado.",
);
await access("client/public/nesplora/assets/index-rTW27scU.js");
await access("client/public/nesplora/assets/index-B5AwPdMj.css");
assertCheck(
  "Assets principais versionados",
  true,
  "JavaScript e CSS principais estão presentes no repositório.",
);

const failed = checks.filter((check) => !check.passed);
for (const check of checks) {
  console.log(`${check.passed ? "✅" : "❌"} ${check.label} — ${check.detail}`);
}
console.log(
  `[persistent-integrations] ${checks.length - failed.length}/${checks.length} verificações aprovadas.`,
);
if (failed.length > 0) process.exit(1);
