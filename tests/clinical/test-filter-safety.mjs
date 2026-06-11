// @ts-check
/**
 * test-filter-safety.mjs — Segurança clínica do motor de filtro (advancedFilterLogic).
 *
 * Executar:  tsx tests/clinical/test-filter-safety.mjs   (ou: npm run test:filter)
 *
 * Cobre os cenários A–G da especificação de reconstrução cirúrgica do filtro:
 *  A) Lactente 0–6m: sem suicídio / TDAH / psicose / autoaplicável.
 *  B) 16–30m + TEA: M-CHAT aparece; instrumentos comerciais/restritos não fingem
 *     aplicação completa.
 *  C) 7 anos + TDAH + professor: prioriza questionário de professor.
 *  D) Adolescente + suicídio: aparece COM aviso de risco.
 *  E) Efeitos colaterais + monitorização: retorna EUSM-10; pré-consulta não.
 *  F) Sem escala segura: lista vazia + mensagem segura (nunca o catálogo inteiro).
 *  G) ASQ: ASQ-3 = desenvolvimento; ASQ suicídio = suicídio; "asq" isolado ≠ suicídio.
 *
 * Falha (exit 1) em qualquer violação.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const {
  filterScalesIntelligently,
  generateContextualRecommendation,
  getApplicationMode,
  getLiteracyRequirement,
  getVerbalRequirement,
  SAFE_EMPTY_MESSAGE,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { guessQueixas } = await imp("client/src/data/queixaMapping.ts");

const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog, { selectedSignals: [], ...ctx });

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ❌ ${msg}`);
  }
}
function head(t) {
  console.log(`\n=== ${t} ===`);
}

// ---------- A) Lactente 0–6 meses ----------
head("A) Lactente 0–6m — bloqueios duros");
{
  const tea = run({ queixas: ["tea"], ageMonths: 3 });
  ok(
    tea.every((m) => !m.scale.queixas.includes("suicidio")),
    "0–6m+TEA não deve conter escala de suicídio"
  );
  ok(
    tea.every((m) => !m.scale.queixas.includes("psicose")),
    "0–6m+TEA não deve conter escala de psicose"
  );
  ok(
    tea.every((m) => getApplicationMode(m.scale) !== "autoquestionario_crianca_adolescente"),
    "0–6m não deve conter instrumento autoaplicável"
  );
  ok(
    tea.every((m) => m.scale.ageMin <= 3 && m.scale.ageMax >= 3),
    "0–6m: toda escala retornada cobre a idade"
  );

  ok(run({ queixas: ["suicidio"], ageMonths: 3 }).length === 0, "0–6m + suicídio => vazio");
  ok(run({ queixas: ["tdah"], ageMonths: 3 }).length === 0, "0–6m + TDAH => vazio");
  ok(run({ queixas: ["psicose"], ageMonths: 3 }).length === 0, "0–6m + psicose => vazio");
}

// ---------- B) 16–30 meses + TEA ----------
head("B) 16–30m + TEA — M-CHAT presente; comerciais não 'completos'");
{
  const r = run({ queixas: ["tea"], ageMonths: 23 });
  ok(r.length > 0, "16–30m+TEA deve retornar candidatos");
  ok(r.some((m) => m.scale.id === "mchat"), "M-CHAT-R/F deve aparecer (triagem TEA 16–30m)");
  const commercial = r.filter((m) => ["ados2", "cars", "adir", "srs2"].includes(m.scale.id));
  ok(
    commercial.every((m) => m.implementationStatus === "external_only"),
    "Instrumentos comerciais/restritos (ADOS-2/CARS-2/ADI-R/SRS-2) => external_only (não 'complete')"
  );
}

// ---------- C) 7 anos + TDAH + professor ----------
head("C) 7 anos + TDAH + professor");
{
  const r = run({ queixas: ["tdah"], ageMonths: 84, respondente: "professor" });
  ok(r.length > 0, "7a+TDAH+professor deve retornar candidatos");
  ok(
    r.every((m) => m.scale.respondente.includes("professor")),
    "todo resultado deve aceitar respondente professor"
  );
  ok(
    r.every((m) => m.scale.ageMin <= 84 && m.scale.ageMax >= 84),
    "nenhuma escala de bebê (idade incompatível)"
  );
  ok(
    getApplicationMode(r[0].scale) === "questionario_professor",
    "o melhor resultado deve ser um questionário de professor"
  );
}

// ---------- D) Adolescente + suicídio ----------
head("D) Adolescente (15a) + suicídio — com aviso de risco");
{
  const r = run({ queixas: ["suicidio"], ageMonths: 180 });
  ok(r.length > 0, "adolescente + suicídio deve retornar candidatos");
  ok(
    r.every((m) => m.warningFlags.some((w) => /risco suicida/i.test(w))),
    "todo instrumento de suicídio deve exibir aviso de risco"
  );
}

// ---------- E) Efeitos colaterais + monitorização ----------
head("E) Efeitos + monitorização — EUSM-10 entra; pré-consulta não");
{
  const mon = run({ queixas: ["efeitos"], ageMonths: 120, assessmentUse: "monitorizacao" });
  ok(mon.length > 0, "efeitos + monitorização deve retornar candidatos");
  ok(
    mon.some((m) => /eusm|satisfa/i.test(m.scale.id + " " + m.scale.name)),
    "efeitos + monitorização deve incluir EUSM-10 / satisfação medicação"
  );

  const pre = run({ queixas: ["tdah"], ageMonths: 84 });
  ok(
    pre.every((m) => !m.scale.queixas.includes("efeitos") && m.scale.prioridade !== "monitorizacao"),
    "pré-consulta diagnóstica NÃO deve conter satisfação medicamentosa/monitorização"
  );
}

// ---------- F) Sem escala segura ----------
head("F) Sem escala segura — vazio + mensagem segura");
{
  const r = run({ queixas: ["suicidio"], ageMonths: 3 });
  ok(r.length === 0, "perfil inseguro => lista vazia (sem fallback de catálogo)");
  ok(
    generateContextualRecommendation(r) === SAFE_EMPTY_MESSAGE,
    "lista vazia => mensagem segura 'sem escala segura'"
  );
}

// ---------- G) ASQ ----------
head("G) ASQ — desenvolvimento vs suicídio");
{
  const asq3 = guessQueixas("Desenvolvimento", "ASQ-3 Ages & Stages Questionnaire 3");
  ok(asq3.includes("atraso"), "ASQ-3 / Ages & Stages => desenvolvimento (atraso)");
  ok(!asq3.includes("suicidio"), "ASQ-3 NÃO deve classificar como suicídio");

  const asqSuicide = guessQueixas("Risco", "Ask Suicide-Screening Questions (ASQ)");
  ok(asqSuicide.includes("suicidio"), "Ask Suicide-Screening => suicídio");

  const asqAlone = guessQueixas("", "ASQ");
  ok(!asqAlone.includes("suicidio"), "'ASQ' isolado NÃO deve virar suicídio automaticamente");
}

// ---------- H) Metadados enriquecidos (verbal/alfabetização derivados) ----------
head("H) Metadados derivados — comunicação e alfabetização");
{
  const byId = (id) => catalog.find((s) => s.id === id);
  // Não-verbal compatível: testes cognitivos não-verbais
  for (const id of ["leiter3", "raven", "toni4"]) {
    const s = byId(id);
    if (s) ok(getVerbalRequirement(s) === "nao_verbal_compativel", `${id} => não-verbal compatível`);
  }
  // Verbal: avaliação direta de linguagem expressiva/fluência
  const fas = byId("fas-fluencia");
  if (fas) ok(getVerbalRequirement(fas) === "verbal", "FAS (fluência verbal) => requer verbal");
  // Autorrelato => requer alfabetização
  for (const id of ["cdi2", "phqa"]) {
    const s = byId(id);
    if (s) ok(getLiteracyRequirement(s) === "alfabetizado", `${id} (autorrelato) => requer alfabetização`);
  }
  // Questionário de pais NÃO exige alfabetização da criança
  for (const id of ["mchat", "cbcl", "scared"]) {
    const s = byId(id);
    if (s) ok(getLiteracyRequirement(s) === "indiferente", `${id} (pais) => alfabetização indiferente`);
  }
  // Pictórico/visual-analógico autorrelato NÃO exige leitura (criança aponta)
  const eva = byId("eva-ped");
  if (eva) ok(getLiteracyRequirement(eva) === "indiferente", "EVA pictórica => alfabetização indiferente");

  // Efeito no filtro: criança não-verbal não recebe instrumento que exige verbal,
  // mas recebe os não-verbais compatíveis.
  const nonVerbalCog = run({ queixas: ["cognicao"], ageMonths: 96, isVerbal: false });
  ok(
    nonVerbalCog.every((m) => getVerbalRequirement(m.scale) !== "verbal"),
    "criança não-verbal: nenhum instrumento que exige fala é recomendado"
  );

  // Efeito no filtro: criança pré-alfabetizada não recebe autorrelato que exige leitura.
  const preLit = run({ queixas: ["depressao"], ageMonths: 108, isLiterate: false });
  ok(
    preLit.every((m) => getLiteracyRequirement(m.scale) !== "alfabetizado"),
    "criança pré-alfabetizada: nenhum instrumento que exige leitura é recomendado"
  );
}

// ---------- Resumo ----------
console.log(`\n${"=".repeat(48)}`);
if (failures === 0) {
  console.log(`✅ FILTER SAFETY OK — ${checks} verificações passaram.`);
  process.exit(0);
} else {
  console.error(`❌ FILTER SAFETY FALHOU — ${failures}/${checks} verificações falharam.`);
  process.exit(1);
}
