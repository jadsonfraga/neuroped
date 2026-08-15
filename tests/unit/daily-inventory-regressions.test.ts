import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaleMessageCatalog2026 } from "../../client/src/data/scaleMessageCatalog2026.ts";
import {
  dailyInventoryMatchesQuery,
  dailyInventorySearchText,
  parseReferenceAgeRange,
} from "../../client/src/lib/instrument-library-filters.ts";
import {
  isValidCalendarDate,
  positiveModulo,
  replaceDatedRecord,
  selectInventorySerial,
  selectTopic,
} from "../../scripts/generate-daily-authorial-inventory.mts";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const ageCases: Array<[string, [number, number] | null]> = [
  ["6 meses–7 anos, com usos específicos até 21 anos", [6, 251]],
  ["2 anos ou mais", [24, 251]],
  ["predominantemente adultos", [216, 251]],
  ["1 mês–5a11m", [1, 71]],
  ["0–7a11m", [0, 95]],
  ["GRS-P 4–6a11m; GRS-S 6–13a11m", [48, 167]],
  ["3–10/11 anos", [36, 132]],
  ["1,5–18 anos", [18, 216]],
  ["12 meses–adulto", [12, 251]],
  ["3 meses–80+ anos", [3, 251]],
  ["8+ anos", [96, 251]],
  ["2–85+ anos", [24, 251]],
  ["primeira infância", [0, 72]],
  ["crianças", [0, 215]],
  ["pré-escolares e escolares", [36, 215]],
  ["6–12 anos, também utilizado em pré-escolares", [36, 144]],
  ["recém-nascido a termo", [0, 1]],
  ["2 anos e 6 meses a 5 anos", [30, 60]],
  ["crianças de 6 a 12 anos", [72, 144]],
  ["adolescentes de 12 a 17 anos", [144, 204]],
  ["até 2 anos", [0, 24]],
  ["20–44 semanas gestacionais", [0, 1]],
  ["34 semanas pós-concepcional–4 meses pós-termo", [0, 4]],
  ["variável por idade/linguagem", null],
];

for (const [label, expected] of ageCases) {
  assert.deepEqual(
    parseReferenceAgeRange(label),
    expected,
    `faixa etária incorreta para “${label}”`,
  );
}

const catalogRanges = [
  ...new Set(scaleMessageCatalog2026.map((record) => record.ageRange)),
];
assert.deepEqual(
  catalogRanges
    .filter((label) => parseReferenceAgeRange(label) === null)
    .sort(),
  ["conforme manual", "variável por idade/linguagem"],
  "somente faixas deliberadamente indeterminadas podem ficar sem limites",
);
for (const label of catalogRanges) {
  const range = parseReferenceAgeRange(label);
  if (!range) continue;
  assert.ok(range[0] >= 0 && range[0] <= range[1] && range[1] <= 251, label);
}

const searchableRecord = {
  title: "Inventário de eventos paroxísticos",
  shortTitle: "Eventos paroxísticos",
  topic: "Semiologia",
  category: "Neurologia infantil",
  subcategory: "Epilepsia",
  purpose: "Registrar episódios súbitos.",
  tags: ["epilepsia"],
  domains: [
    {
      label: "Fenômenos autonômicos",
      description: "Cor, respiração e sinais vegetativos.",
    },
  ],
  items: [{ text: "O episódio começa de forma súbita." }],
};
const searchText = dailyInventorySearchText(searchableRecord);
assert.match(searchText, /Fenômenos autonômicos/);
assert.match(searchText, /sinais vegetativos/);
assert.equal(
  dailyInventoryMatchesQuery(searchableRecord, "fenomenos autonomicos"),
  true,
);
assert.equal(
  dailyInventoryMatchesQuery(searchableRecord, "SINAIS VEGETATIVOS"),
  true,
);
assert.equal(
  dailyInventoryMatchesQuery(searchableRecord, "termo inexistente"),
  false,
);

const libraryPage = await readFile(
  path.join(ROOT, "client/src/pages/biblioteca-instrumentos.tsx"),
  "utf8",
);
const watchdogWorkflow = await readFile(
  path.join(ROOT, ".github/workflows/daily-authorial-watchdog.yml"),
  "utf8",
);
assert.match(
  libraryPage,
  /dailyInventoryMatchesQuery\(record, query\)/,
  "a UI deve usar o predicado de busca coberto pelo teste",
);

// O watchdog respeita a revisão humana: main válida segue para os mirrors; caso
// contrário, somente execução + artefato + branch + PR coerentes viram sucesso
// `review_pending`. O CLI `gh` não recebe os argumentos próprios do jq.
assert.match(watchdogWorkflow, /pull-requests: read/);
assert.match(watchdogWorkflow, /timeout-minutes: 150/);
assert.match(watchdogWorkflow, /id: date/);
assert.match(watchdogWorkflow, /workflow-run-artifact/);
assert.match(
  watchdogWorkflow,
  /capture\("\^inventario-autoral-\(\?<date>\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\)-\[0-9\]\+\$"\)/,
);
assert.match(watchdogWorkflow, /TRIGGER_EVENT:/);
assert.match(watchdogWorkflow, /TRIGGER_CREATED_AT:/);
assert.match(watchdogWorkflow, /unattributed-workflow-run/);
assert.match(watchdogWorkflow, /NEUROPED_GENERATION_DATE=\$effective_date/);
assert.match(watchdogWorkflow, /github\.event_name != 'workflow_run'/);
assert.match(watchdogWorkflow, /echo "state=production"/);
assert.match(watchdogWorkflow, /echo "state=review_pending"/);
assert.match(
  watchdogWorkflow,
  /actions\/runs\/\$\{RECOVERY_RUN_ID\}\/artifacts\?per_page=100/,
);
assert.match(watchdogWorkflow, /gh run download "\$RECOVERY_RUN_ID"/);
assert.match(
  watchdogWorkflow,
  /git fetch origin "\+refs\/heads\/\$branch:refs\/remotes\/origin\/\$branch"/,
);
assert.match(
  watchdogWorkflow,
  /repos\/\$\{GITHUB_REPOSITORY\}\/pulls[\s\S]{0,220}-f head="\$\{GITHUB_REPOSITORY_OWNER\}:\$\{branch\}"/,
);
assert.match(watchdogWorkflow, /artifact_sha/);
assert.match(watchdogWorkflow, /branch_file_sha/);
assert.match(watchdogWorkflow, /review_branch_commit/);
assert.match(watchdogWorkflow, /\.head\.repo\.full_name == \$repo/);
assert.match(watchdogWorkflow, /\.base\.repo\.full_name == \$repo/);
assert.match(watchdogWorkflow, /head_ref_oid/);
assert.match(
  watchdogWorkflow,
  /\[ "\$head_ref_oid" = "\$review_branch_commit" \]/,
);
assert.match(watchdogWorkflow, /pr_draft=/);
assert.match(
  watchdogWorkflow,
  /if: steps\.date\.outputs\.current == 'true' && steps\.catalog\.outputs\.state == 'production'/,
  "produção só pode ser sincronizada quando a data já estiver válida na main",
);
assert.match(
  watchdogWorkflow,
  /if: success\(\) && steps\.date\.outputs\.skip != 'true' && steps\.date\.outputs\.current == 'true'/,
  "backfill histórico não pode encerrar o incidente do dia corrente",
);
assert.doesNotMatch(
  watchdogWorkflow,
  /gh pr list[\s\S]{0,260}--head "\$branch"/,
  "nome da branch sem vínculo ao repositório permite colisão com PR de fork",
);
assert.doesNotMatch(
  watchdogWorkflow,
  /gh run list[\s\S]{0,360}--jq\s+--arg/,
  "--arg pertence ao jq, não ao gh run list",
);
assert.doesNotMatch(
  watchdogWorkflow,
  /gh api[\s\S]{0,260}--jq\s+--arg/,
  "--arg pertence ao jq, não ao gh api",
);
assert.doesNotMatch(
  watchdogWorkflow,
  /Inventário diário permanece ausente ou inválido/,
  "main não deve ser exigida antes da revisão humana do PR",
);

assert.equal(isValidCalendarDate("2028-02-29"), true);
assert.equal(isValidCalendarDate("2027-02-29"), false);
assert.equal(isValidCalendarDate("2027-02-30"), false);
assert.equal(isValidCalendarDate("2027-13-01"), false);
assert.equal(positiveModulo(-1, 5), 4);
assert.equal(positiveModulo(-6, 5), 4);
const previousTopicId = process.env.NEUROPED_DAILY_TOPIC_ID;
delete process.env.NEUROPED_DAILY_TOPIC_ID;
try {
  assert.equal(
    selectTopic("2026-07-26", []).id,
    "familia_transicao_cuidado",
    "backfill anterior à âncora deve usar módulo positivo",
  );
  assert.equal(
    selectTopic("2026-07-19", []).id,
    "familia_qualidade_vida",
    "semanas negativas consecutivas devem manter a rotação",
  );
} finally {
  if (previousTopicId === undefined) delete process.env.NEUROPED_DAILY_TOPIC_ID;
  else process.env.NEUROPED_DAILY_TOPIC_ID = previousTopicId;
}

const invalidDateRun = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    path.join(ROOT, "scripts/generate-daily-authorial-inventory.mts"),
  ],
  {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NEUROPED_GENERATION_DATE: "2027-02-30",
      NEUROPED_DAILY_TOPIC_ID: "",
      NEUROPED_DAILY_FORCE: "false",
      OPENAI_API_KEY: "",
    },
  },
);
assert.equal(invalidDateRun.status, 1);
const invalidDateOutput = `${invalidDateRun.stdout}${invalidDateRun.stderr}`;
assert.match(
  invalidDateOutput,
  /Data deve usar AAAA-MM-DD e existir no calendário/,
);
assert.doesNotMatch(
  invalidDateOutput,
  /OPENAI_API_KEY não configurada/,
  "a data deve falhar antes da credencial ou da API",
);

const invalidFallbackDateRun = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    path.join(ROOT, "scripts/generate-daily-authorial-fallback.mts"),
  ],
  {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NEUROPED_GENERATION_DATE: "2027-02-30",
    },
  },
);
assert.equal(invalidFallbackDateRun.status, 1);
assert.match(
  `${invalidFallbackDateRun.stdout}${invalidFallbackDateRun.stderr}`,
  /Data deve usar AAAA-MM-DD e existir no calendário/,
);

const invalidCatalogDir = await mkdtemp(
  path.join(tmpdir(), "neuroped-daily-invalid-catalog-"),
);
try {
  const catalogDir = path.join(ROOT, "client/src/data/daily-authorial");
  const fixtureFilename = (await readdir(catalogDir)).find((file) =>
    file.endsWith(".json"),
  );
  assert.ok(fixtureFilename, "o catálogo deve fornecer uma fixture válida");
  const invalidRecord = JSON.parse(
    await readFile(path.join(catalogDir, fixtureFilename), "utf8"),
  );
  invalidRecord.generatedOn = "2027-02-30";
  await writeFile(
    path.join(invalidCatalogDir, fixtureFilename),
    JSON.stringify(invalidRecord),
  );
  const invalidCatalogRun = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      path.join(ROOT, "scripts/generate-daily-authorial-inventory.mts"),
      "--validate-only",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        NEUROPED_DAILY_OUTPUT_DIR: invalidCatalogDir,
      },
    },
  );
  assert.equal(invalidCatalogRun.status, 1);
  assert.match(
    `${invalidCatalogRun.stdout}${invalidCatalogRun.stderr}`,
    /data de geração inválida/,
    "a auditoria do catálogo deve rejeitar datas normalizadas pelo JavaScript",
  );
} finally {
  await rm(invalidCatalogDir, { recursive: true, force: true });
}

assert.equal(
  selectInventorySerial("2026-08-08", [
    { generatedOn: "2026-08-08", id: "NEUROPED-DIARIO-20260808-1000" },
    { generatedOn: "2026-08-07", id: "NEUROPED-DIARIO-20260807-1001" },
  ]),
  "1000",
  "a reexecução deve preservar o serial da data, inclusive acima de 999",
);
assert.equal(
  selectInventorySerial("2026-08-09", [
    { generatedOn: "2026-08-08", id: "NEUROPED-DIARIO-20260808-999" },
  ]),
  "1000",
);
assert.equal(
  selectInventorySerial("2026-08-10", [
    { generatedOn: "2026-08-09", id: "NEUROPED-DIARIO-20260809-1000" },
  ]),
  "1001",
);

const protectedDir = await mkdtemp(
  path.join(tmpdir(), "neuroped-daily-protected-"),
);
try {
  const protectedFilename = "2026-08-08-revisado.json";
  const protectedContent = JSON.stringify({
    generatedOn: "2026-08-08",
    id: "NEUROPED-DIARIO-20260808-777",
    status: "revisado_clinicamente",
  });
  await writeFile(path.join(protectedDir, protectedFilename), protectedContent);
  const protectedForceRun = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      path.join(ROOT, "scripts/generate-daily-authorial-inventory.mts"),
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        NEUROPED_DAILY_OUTPUT_DIR: protectedDir,
        NEUROPED_GENERATION_DATE: "2026-08-08",
        NEUROPED_DAILY_FORCE: "true",
        OPENAI_API_KEY: "",
      },
    },
  );
  assert.equal(protectedForceRun.status, 1);
  const protectedForceOutput = `${protectedForceRun.stdout}${protectedForceRun.stderr}`;
  assert.match(protectedForceOutput, /Substituição bloqueada/);
  assert.doesNotMatch(protectedForceOutput, /OPENAI_API_KEY não configurada/);
  assert.equal(
    await readFile(path.join(protectedDir, protectedFilename), "utf8"),
    protectedContent,
    "force não pode alterar um inventário revisado",
  );
} finally {
  await rm(protectedDir, { recursive: true, force: true });
}

const outputDir = await mkdtemp(
  path.join(tmpdir(), "neuroped-daily-inventory-"),
);
try {
  await writeFile(
    path.join(outputDir, "2026-08-08-antigo.json"),
    JSON.stringify({ generatedOn: "2026-08-08", id: "old-a" }),
  );
  await writeFile(
    path.join(outputDir, "2026-08-08-duplicado.json"),
    JSON.stringify({ generatedOn: "2026-08-08", id: "old-b" }),
  );
  await writeFile(
    path.join(outputDir, "2026-08-07-preservar.json"),
    JSON.stringify({ generatedOn: "2026-08-07", id: "keep" }),
  );

  const replacement = JSON.stringify({ generatedOn: "2026-08-08", id: "new" });
  await replaceDatedRecord(
    "2026-08-08",
    "2026-08-08-substituto.json",
    replacement,
    outputDir,
  );

  assert.deepEqual((await readdir(outputDir)).sort(), [
    "2026-08-07-preservar.json",
    "2026-08-08-substituto.json",
  ]);
  assert.equal(
    await readFile(path.join(outputDir, "2026-08-08-substituto.json"), "utf8"),
    replacement,
  );

  const secondReplacement = JSON.stringify({
    generatedOn: "2026-08-08",
    id: "new",
    revision: 2,
  });
  await replaceDatedRecord(
    "2026-08-08",
    "2026-08-08-segunda-versao.json",
    secondReplacement,
    outputDir,
  );
  assert.deepEqual((await readdir(outputDir)).sort(), [
    "2026-08-07-preservar.json",
    "2026-08-08-segunda-versao.json",
  ]);
  assert.equal(
    await readFile(
      path.join(outputDir, "2026-08-08-segunda-versao.json"),
      "utf8",
    ),
    secondReplacement,
  );

  await Promise.all([
    replaceDatedRecord(
      "2026-08-08",
      "2026-08-08-corrida-a.json",
      JSON.stringify({ generatedOn: "2026-08-08", id: "race-a" }),
      outputDir,
    ),
    replaceDatedRecord(
      "2026-08-08",
      "2026-08-08-corrida-b.json",
      JSON.stringify({ generatedOn: "2026-08-08", id: "race-b" }),
      outputDir,
    ),
  ]);
  const concurrentFiles = (await readdir(outputDir)).sort();
  assert.equal(
    concurrentFiles.filter((file) => file.startsWith("2026-08-08-")).length,
    1,
    "substituições concorrentes devem terminar com exatamente um inventário",
  );
  assert.equal(
    concurrentFiles.some(
      (file) => file.endsWith(".tmp") || file.endsWith(".lock"),
    ),
    false,
    "a substituição não pode deixar temporários ou locks",
  );
} finally {
  await rm(outputDir, { recursive: true, force: true });
}

console.log(
  "✓ regressões pós-merge do inventário diário permanecem corrigidas",
);
