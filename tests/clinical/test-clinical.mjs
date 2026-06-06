// @ts-check
/**
 * test-clinical.mjs — Suíte de testes clínicos do motor de filtro (Bloco E1).
 *
 * Executado via tsx (resolve imports .ts do catálogo):
 *   tsx tests/clinical/test-clinical.mjs
 *
 * Cobertura: cada queixa × cada faixa etária × bordas etárias
 * (0, 6, 12, 24, 48, 72, 96, 120, 144, 216 meses). Para cada caso valida:
 *   1. Estrutura sem NaN/undefined nos campos essenciais.
 *   2. Match de queixa (toda escala devolvida cobre a queixa pedida).
 *   3. Sobreposição etária (a escala cobre algum ponto da faixa pedida).
 *   4. Monotonicidade do scoreFit: ordenação por prioridade e, dentro da
 *      mesma prioridade, relevância não-crescente.
 *   5. Top-3 estável: duas chamadas idênticas devolvem a mesma ordem.
 *   6. Não-vazamento direcional: uma ferramenta de diário/monitorização
 *      (ex.: Diário de Crises, Calendário de Cefaleia) só pode aparecer sob
 *      a SUA queixa — nunca sob uma queixa clínica não relacionada.
 *
 * Meta: ≥ 150 casos. Falha (exit 1) em qualquer violação.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const mod = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);
const { filterScales, allScales, queixas, faixasEtarias } = mod;

const PRIO = { triagem: 0, diagnostica: 1, monitorizacao: 2 };
// Rotas de diário/monitorização e a queixa a que cada uma legitimamente pertence.
const DIARY_ROUTES = new Set([
  "/diario-sono", "/diario-alimentar", "/diario-escola",
  "/epilepsia", "/cefaleia",
]);
const DIARY_QUEIXAS = new Set(["epilepsia", "dor", "sono", "alimentacao"]);
const VALID_RESP = new Set(["pais", "crianca", "clinico", "professor", "autoaplicavel"]);

let cases = 0;
let assertions = 0;
const failures = [];

function fail(ctx, msg) {
  failures.push(`[${ctx}] ${msg}`);
}
function ok(cond, ctx, msg) {
  assertions++;
  if (!cond) fail(ctx, msg);
}

// Réplica da relevância do motor (para checar monotonicidade da ordenação).
function relevanceOf(scale, qs) {
  let r = 0;
  if (qs.length > 0) r = scale.queixas.filter((q) => qs.includes(q)).length;
  if (scale.appRoute) r += 0.5;
  return r;
}

function idSeq(list) {
  return list.map((s) => s.id).join("|");
}

function checkResult(ctx, res, qs, age) {
  ok(Array.isArray(res), ctx, "resultado não é array");
  if (!Array.isArray(res)) return;

  for (const s of res) {
    // 1. Estrutura
    ok(typeof s.id === "string" && s.id.length > 0, ctx, `id inválido: ${JSON.stringify(s.id)}`);
    ok(typeof s.name === "string" && s.name.length > 0, ctx, `name inválido em ${s.id}`);
    ok(Number.isFinite(s.ageMin), ctx, `ageMin NaN/undefined em ${s.id}`);
    ok(Number.isFinite(s.ageMax), ctx, `ageMax NaN/undefined em ${s.id}`);
    ok(s.prioridade in PRIO, ctx, `prioridade inválida em ${s.id}: ${s.prioridade}`);
    ok(Array.isArray(s.respondente) && s.respondente.length > 0, ctx, `respondente vazio em ${s.id}`);
    ok(s.respondente.every((r) => VALID_RESP.has(r)), ctx, `respondente desconhecido em ${s.id}: ${s.respondente}`);

    // 2. Match de queixa
    if (qs.length > 0) {
      ok(s.queixas.some((q) => qs.includes(q)), ctx, `escala ${s.id} não cobre queixa pedida (${qs})`);
    }
    // 3. Sobreposição etária
    if (age) {
      ok(s.ageMax >= age.min && s.ageMin <= age.max, ctx, `escala ${s.id} fora da faixa [${age.min},${age.max}] (escala [${s.ageMin},${s.ageMax}])`);
    }
    // 6. Não-vazamento direcional: se uma rota de diário aparece, ao menos
    //    uma queixa selecionada (quando há seleção) deve ser de diário.
    if (qs.length > 0 && s.appRoute && DIARY_ROUTES.has(s.appRoute)) {
      ok(qs.some((q) => DIARY_QUEIXAS.has(q)) && s.queixas.some((q) => qs.includes(q)),
        ctx, `diário ${s.id} vazou sob queixa não relacionada (${qs})`);
    }
  }

  // 4. Monotonicidade: prioridade não-decrescente; relevância não-crescente dentro da prioridade
  for (let i = 1; i < res.length; i++) {
    const a = res[i - 1], b = res[i];
    ok(PRIO[a.prioridade] <= PRIO[b.prioridade], ctx, `ordem de prioridade quebrada: ${a.id} antes de ${b.id}`);
    if (PRIO[a.prioridade] === PRIO[b.prioridade]) {
      ok(relevanceOf(a, qs) >= relevanceOf(b, qs) - 1e-9, ctx, `scoreFit não monotônico: ${a.id}(${relevanceOf(a, qs)}) antes de ${b.id}(${relevanceOf(b, qs)})`);
    }
  }

  // 5. Top-3 estável (chamada idempotente)
  const res2 = filterScales(qs, age);
  ok(idSeq(res) === idSeq(res2), ctx, "resultado não determinístico entre chamadas");
}

// ---- Geração de casos ----
const boundaries = [0, 6, 12, 24, 48, 72, 96, 120, 144, 216];

// A) cada queixa × faixa etária do app
for (const q of queixas) {
  for (const f of faixasEtarias) {
    cases++;
    checkResult(`${q.id}@${f.id}`, filterScales([q.id], { min: f.min, max: f.max }), [q.id], { min: f.min, max: f.max });
  }
  // B) cada queixa sem restrição de idade
  cases++;
  checkResult(`${q.id}@all`, filterScales([q.id], null), [q.id], null);
}

// C) bordas etárias pontuais em queixas de alto volume
for (const qid of ["atraso", "tea", "tdah", "ansiedade", "epilepsia"]) {
  for (const m of boundaries) {
    cases++;
    checkResult(`${qid}@${m}m`, filterScales([qid], { min: m, max: m }), [qid], { min: m, max: m });
  }
}

// D) combinações de múltiplas queixas (relevância > 1)
const combos = [
  ["tea", "tdah"], ["atraso", "linguagem"], ["ansiedade", "depressao"],
  ["tea", "comportamento"], ["pc", "motor"], ["sono", "comportamento"],
];
for (const c of combos) {
  for (const f of faixasEtarias) {
    cases++;
    checkResult(`${c.join("+")}@${f.id}`, filterScales(c, { min: f.min, max: f.max }), c, { min: f.min, max: f.max });
  }
}

// E) filtro vazio (sem queixa) por faixa — deve devolver instrumentos válidos
for (const f of faixasEtarias) {
  cases++;
  checkResult(`vazio@${f.id}`, filterScales([], { min: f.min, max: f.max }), [], { min: f.min, max: f.max });
}

// F) não-vazamento: filtrar por queixa clínica NÃO-diário nunca traz diário
const naoDiario = queixas.map((q) => q.id).filter((id) => !DIARY_QUEIXAS.has(id));
for (const qid of naoDiario) {
  cases++;
  const res = filterScales([qid], null);
  for (const s of res) {
    ok(!(s.appRoute && DIARY_ROUTES.has(s.appRoute)),
      `naoleak@${qid}`, `diário ${s.id} vazou em queixa não-diário "${qid}"`);
  }
}

// ---- Relatório ----
console.log(`[clinical] casos=${cases} assertivas=${assertions} catálogo=${allScales.length} escalas`);
if (cases < 150) {
  console.error(`[clinical] ✗ apenas ${cases} casos (< 150 exigidos).`);
  process.exit(1);
}
if (failures.length > 0) {
  console.error(`[clinical] ✗ ${failures.length} falha(s):`);
  for (const f of failures.slice(0, 40)) console.error(`  ✗ ${f}`);
  if (failures.length > 40) console.error(`  … +${failures.length - 40} outras`);
  process.exit(1);
}
console.log(`[clinical] ✓ ${cases} casos, ${assertions} assertivas — tudo verde.`);
