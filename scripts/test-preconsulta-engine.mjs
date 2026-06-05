/* ============================================================
   NeuroPed SDG — scripts/test-preconsulta-engine.mjs
   ------------------------------------------------------------
   Teste COMPORTAMENTAL do motor de pré-consulta (Node puro).
   Vai além de casar strings: carrega o CATÁLOGO real + os módulos
   (gate, smart-rank, perguntas-guia, taxonomia) e valida invariantes:

     1) Gate (definição única): diários/bancos/clínicos NUNCA passam
        — inclui a regressão dos diários titulados "Inventário".
     2) SmartRank: expande a queixa leiga ao construto clínico.
     3) Perguntas-guia: as queixas completadas respondem (não caem no
        fallback genérico).
     4) Pipeline de triagem: para uma queixa real, 0 diários/0 clínicos
        no resultado e o instrumento esperado aparece.

   Sai !=0 em qualquer falha (CI). Uso: node scripts/test-preconsulta-engine.mjs
   ============================================================ */
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(import.meta.url);
const fails = [];
const oks = [];
const ok = (m) => oks.push('OK: ' + m);
const fail = (m) => fails.push('FAIL: ' + m);
const assert = (cond, m) => (cond ? ok(m) : fail(m));

// ── Stub mínimo de browser para carregar os bundles do catálogo ──
const g = globalThis;
g.window = g;
g.document = { addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; },
  createElement() { return { style: {}, appendChild() {}, setAttribute() {}, classList: { add() {}, remove() {} } }; },
  readyState: 'complete', head: { appendChild() {} }, body: { appendChild() {} } };
g.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
function softSet(k, v) { try { g[k] = v; } catch { /* read-only no Node 22 — ok */ } }
softSet('navigator', { userAgent: 'node' });
softSet('location', { href: '', search: '', pathname: '/' });
softSet('fetch', () => Promise.reject(new Error('no fetch in node')));

const BUNDLES = ['scales-editorial.js', 'scales-bundle.js', 'scales-453-authorial.js', 'scales-global-max.js',
  'scales-featured-extra.js', 'scales-featured-10.js', 'scales-priority-uploaded.js', 'scales-diarios-uteis.js',
  'scales-autorais-npe.js', 'scales-autorais-npe-lote2.js', 'scales-impacto-medicacao.js',
  'scales-oficiais.js', 'scales-oficiais-lote2.js', 'scales-intl-livres.js'];
for (const f of BUNDLES) { try { require(join(root, f)); } catch (e) { /* opcional */ } }

const Gate = require(join(root, 'scales-preconsulta-gate.js'));
const Smart = require(join(root, 'scales-smart-rank.js'));
const Q = require(join(root, 'scales-questions.js'));

const cat = (g.NEUROPED_EDITORIAL_SCALES || []).filter(s => s && s.id);
assert(cat.length > 300, `catálogo carregado (${cat.length} instrumentos)`);

// 1) GATE — definição única -------------------------------------------------
const diaries = cat.filter(s => s.kind === 'diário' || s.daily === true);
assert(diaries.length > 0, `catálogo contém diários para testar o gate (${diaries.length})`);
const diaryLeak = diaries.filter(s => !Gate.isDiary(s));
assert(diaryLeak.length === 0, `gate marca TODOS os diários como diário (0 vazamentos; achou ${diaryLeak.length})`);

// regressão específica: diário titulado "Inventário … ritmo diário" não pode vazar
const invDiaries = diaries.filter(s => /invent[áa]rio/i.test(s.title || ''));
assert(invDiaries.length === 0 || invDiaries.every(s => Gate.isDiary(s)),
  `diários titulados "Inventário" não vazam (${invDiaries.length} casos cobertos)`);

// clínicos conhecidos (quando presentes) são barrados
const cssrs = cat.find(s => s.id === 'ofc-cssrs');
if (cssrs) assert(Gate.isClinicalOnly(cssrs), 'C-SSRS (entrevista de risco) é barrado como aplicação clínica');
const clinicalCount = cat.filter(s => Gate.isClinicalOnly(s)).length;
assert(clinicalCount >= 1 && clinicalCount <= 20, `gate clínico é cirúrgico (${clinicalCount} instrumentos, esperado 1–20)`);

// filter(): resultado limpo
const passed = Gate.filter(cat);
const dirtyD = passed.filter(Gate.isDiary).length;
const dirtyB = passed.filter(Gate.isBank).length;
const dirtyC = passed.filter(Gate.isClinicalOnly).length;
assert(dirtyD === 0 && dirtyB === 0 && dirtyC === 0,
  `Gate.filter() devolve lista limpa (diários=${dirtyD} bancos=${dirtyB} clínicos=${dirtyC})`);
assert(passed.length > 200, `pré-consulta mantém o grosso do catálogo (${passed.length} de ${cat.length})`);

// 2) SMARTRANK — expansão queixa→construto ----------------------------------
const expanded = Smart.expand('criança desatento e hiperativo na escola');
assert(expanded.includes('tdah'), `SmartRank expande "desatento/hiperativo" → tdah (${expanded.slice(0, 6).join(',')})`);
const expAnx = Smart.expand('adolescente muito ansioso e com medo');
assert(expAnx.includes('ansiedade'), 'SmartRank expande "ansioso/medo" → ansiedade');

// 2b) SMARTRANK — PRECISÃO (caça-bruxas anti-falso-positivo) ----------------
const expTea = Smart.expand('autismo');
assert(expTea.includes('tea') && expTea.includes('autismo'), 'expand mantém o construto TEA');
assert(!expTea.includes('visual') && !expTea.includes('conta') && !expTea.includes('objetos'),
  'expand NÃO injeta fragmentos genéricos de frase (visual/conta/objetos)');
const TM = Smart.tokenMatches;
assert(typeof TM === 'function', 'SmartRank expõe tokenMatches()');
assert(TM('impulsiv', 'crianca muito impulsiva') === true, 'tokenMatches: stem casa (impulsiv→impulsiva)');
assert(TM('oposic', 'comportamento de oposicao') === true, 'tokenMatches: stem casa (oposic→oposicao)');
assert(TM('dor', 'demora para dormir e acorda a noite') === false, 'tokenMatches: "dor" NÃO casa "dormir" (bruxa morta)');
assert(TM('tod', 'todos os dias falta na escola') === false, 'tokenMatches: "tod" NÃO casa "todos" (bruxa morta)');
assert(TM('tdah', 'quadro compativel com tdah') === true, 'tokenMatches: "tdah" (palavra exata) casa');
assert(TM('contato visual', 'mantem pouco contato visual') === true, 'tokenMatches: frase casa por substring');

// 3) PERGUNTAS-GUIA — queixas completadas respondem -------------------------
const guideTags = ['alimentacao', 'adaptativo', 'agressividade', 'epilepsia'];
let guideBad = 0;
for (const t of guideTags) {
  const gq = Q.guide(t, 48);
  const good = Array.isArray(gq) && gq.length >= 2 && gq.every(x => x.pergunta && x.emoji);
  if (!good) { guideBad++; fail(`guide('${t}') incompleto (${gq && gq.length})`); }
}
if (!guideBad) ok(`perguntas-guia completas p/ as queixas antes vagas (${guideTags.join(', ')})`);

// 4) PIPELINE de triagem — invariantes end-to-end ---------------------------
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function candidatesFor(query) {
  const tokens = Smart.expand(query).filter(x => x.length >= 3);
  return Gate.filter(cat).filter(s => {
    const terms = norm([].concat(s.keywords || [], s.complaints || [], s.symptoms || [], [s.domain, s.title, s.short_title]).join(' '));
    return tokens.some(tk => terms.indexOf(tk) >= 0);
  });
}
const res = candidatesFor('criança 6 anos agitada, escola suspeita de TDAH');
assert(res.length > 0, `triagem TDAH retorna candidatos (${res.length})`);
assert(res.filter(Gate.isDiary).length === 0, 'triagem TDAH: 0 diários no resultado');
assert(res.filter(Gate.isClinicalOnly).length === 0, 'triagem TDAH: 0 instrumentos de aplicação clínica no resultado');

// SmartRank.pickTop: dedup + mix de modalidade
const rows = res.slice(0, 20).map(s => ({ s, sc: 1 }));
const top = Smart.pickTop(rows, 3);
assert(top.length >= 1 && top.length <= 3, `pickTop devolve top-3 (${top.length})`);
const ids = top.map(r => r.s.id);
assert(new Set(ids).size === ids.length, 'pickTop não repete instrumento no topo');

// 5) SMARTRANK — funções puras (unidade de lógica, não só fiação) -----------
assert(Smart.modalityOf(null) === 'escala', 'modalityOf(null) → escala (default seguro)');
assert(Smart.modalityOf({ direct_test: true }) === 'direto', 'modalityOf: direct_test → direto');
assert(Smart.modalityOf({ kind: 'teste_direto' }) === 'direto', 'modalityOf: kind teste_direto → direto');
assert(Smart.modalityOf({ audience: 'familia' }) === 'familia', 'modalityOf: audience familia → familia');
assert(Smart.modalityOf({ audience: 'escola' }) === 'escola', 'modalityOf: audience escola → escola');
assert(Smart.modalityOf({ audience: 'clinico' }) === 'escala', 'modalityOf: audience desconhecido → escala (fallback)');

const sA = { domain: 'TDAH', age_band: '6-12', audience: 'familia' };
const sB = { domain: 'TDAH', age_band: '6-12', audience: 'escola' };
assert(Smart.sig(sA) === Smart.sig({ ...sA }), 'sig: instrumentos equivalentes → mesma assinatura');
assert(Smart.sig(sA) !== Smart.sig(sB), 'sig: respondente diferente → assinatura diferente');

const dd = Smart.dedupAll([{ s: { id: 'a', ...sA }, sc: 3 }, { s: { id: 'b', ...sA }, sc: 2 }, { s: { id: 'c', ...sB }, sc: 1 }]);
assert(dd.length === 2 && dd[0].s.id === 'a', 'dedupAll: colapsa variante quase idêntica e mantém a 1ª (maior score)');

const mixRows = [
  { s: { id: 'e1', domain: 'd1', age_band: 'x', audience: 'clinico' }, sc: 9 },
  { s: { id: 'e2', domain: 'd2', age_band: 'x', audience: 'clinico' }, sc: 8 },
  { s: { id: 'dt', domain: 'd3', age_band: 'x', direct_test: true }, sc: 5 },
  { s: { id: 'fm', domain: 'd4', age_band: 'x', audience: 'familia' }, sc: 4 }];
const mixMods = Smart.pickTop(mixRows, 3).map(r => Smart.modalityOf(r.s));
assert(mixMods.includes('direto') && mixMods.includes('familia'),
  `pickTop mistura modalidades quando há de cada (1 direto + 1 família): [${mixMods.join(',')}]`);

assert(Smart.constructsOf('autismo').includes('tea'), 'constructsOf: "autismo" → construto tea');
assert(Smart.constructsOf('adolescente muito ansioso e com medo').includes('ansiedade'), 'constructsOf: queixa de ansiedade → construto ansiedade');
assert(Array.isArray(Smart.expand('')) && Array.isArray(Smart.expand('   ')), 'expand("") / espaços não quebram (retornam array)');
const gib = Smart.expand('xyzqwk zzzz');
assert(Array.isArray(gib) && !gib.includes('tdah') && !gib.includes('tea'), 'expand(gibberish) não inventa construto clínico');

// 6) SEGURANÇA — instrumentos de risco NUNCA chegam à família/secretaria -----
// Invariante crítico: rastreio/avaliação de suicídio ou autolesão exige
// profissional treinado e juízo de risco ao vivo; jamais é auto-aplicado na
// sala de espera. Pega regressão como o ASQ vazando por ID desatualizado.
const riskRe = /suic[ií]d|autoexterm|se machucar|automutila|autoles[ãa]o|idea[çc][ãa]o suicida|risco de vida/i;
const riskItems = cat.filter(s => riskRe.test([s.title, s.short_title, s.domain].join(' ')));
const riskLeak = riskItems.filter(s => Gate.allow(s));
assert(riskItems.length === 0 || riskLeak.length === 0,
  `instrumentos de risco (suicídio/autolesão) barrados da pré-consulta (${riskItems.length} no catálogo, ${riskLeak.length} vazando${riskLeak.length ? ': ' + riskLeak.map(s => s.id).join(',') : ''})`);

// ── Relatório ──
console.log(oks.join('\n'));
if (fails.length) {
  console.log('\n' + fails.join('\n'));
  console.log(`\nMotor pré-consulta: ${oks.length} OK, ${fails.length} FALHA(S).`);
  process.exit(1);
}
console.log(`\nMotor pré-consulta: ${oks.length} OK, 0 falhas.`);
// Encerramento explícito: os bundles do catálogo registram timers (setInterval de
// boot) que mantêm o event loop vivo — sem isto o processo penduraria no CI.
process.exit(0);
