/* ============================================================================
   tests/run-engine-properties.mjs — testes de PROPRIEDADE do motor de ranking
   ----------------------------------------------------------------------------
   FASE 2 (acurácia clínica VERIFICÁVEL por máquina, sem juízo clínico humano).
   scales-smart-rank.js é puro (module.exports) → testável em Node sem browser.
   Aqui validamos INVARIANTES da fórmula de fit e da seleção de topo: as regras
   que precisam valer SEMPRE, independentemente de qual instrumento é "o certo"
   (isso é juízo médico, fora do escopo de máquina — declarado no doc).
   Invariantes derivadas DIRETO do código (scoreFit/ageFit/pickTop/confOf):
     · scoreFit é finito e ∈ [0, 98] · monotônico por eixo (queixa/idade/responde)
     · ageFit usa a BORDA mais próxima (não o ponto-médio) · idade? → 14/partial
     · confOf monotônico (parcial→boa→alta) · pickTop ≤ n, sem id repetido,
       ordenado por score desc, deduplica variantes de mesma assinatura
   Uso: node tests/run-engine-properties.mjs
   ============================================================================ */
import { createRequire } from 'node:module';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const SR = require(join(process.cwd(), 'scales-smart-rank.js'));

let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; fails.push(msg); } }

// ── scoreFit: finito e ∈ [0,98] (max=40+26+22+6+4; min=0) ──
const realistas = [
  {}, null, undefined,
  { qStrong: true, agePoints: 26, respChosen: true, respMatch: true, official: true, featured: true },
  { agePoints: 0, respChosen: true, respMatch: false },
  { qOK: true, agePoints: 10, respChosen: false },
  { agePoints: 'x' }, { qStrong: 'sim' }, { respChosen: true },
];
for (const p of realistas) {
  const v = SR.scoreFit(p);
  ok(Number.isFinite(v), `scoreFit finito p/ ${JSON.stringify(p)} → ${v}`);
  ok(v >= 0 && v <= 98, `scoreFit ∈ [0,98] p/ ${JSON.stringify(p)} → ${v}`);
}
// monotonicidade da QUEIXA (forte > casa > nenhuma), demais eixos fixos
const base = { agePoints: 0, respChosen: true, respMatch: false };
ok(SR.scoreFit({ ...base, qStrong: true }) > SR.scoreFit({ ...base, qOK: true }), 'queixa: forte > casa');
ok(SR.scoreFit({ ...base, qOK: true }) > SR.scoreFit({ ...base }), 'queixa: casa > nenhuma');
// monotonicidade de QUEM RESPONDE (escolhido+casa > neutro > escolhido+não-casa)
const bq = { qOK: true, agePoints: 0 };
ok(SR.scoreFit({ ...bq, respChosen: true, respMatch: true }) > SR.scoreFit({ ...bq, respChosen: false }), 'responde: casa > neutro');
ok(SR.scoreFit({ ...bq, respChosen: false }) > SR.scoreFit({ ...bq, respChosen: true, respMatch: false }), 'responde: neutro > não-casa');
// proveniência/destaque somam (e nunca pioram)
ok(SR.scoreFit({ official: true }) > SR.scoreFit({}), 'official soma (+6)');
ok(SR.scoreFit({ featured: true }) > SR.scoreFit({}), 'featured soma (+4)');

// ── ageFit: borda mais próxima, monotônico, idade desconhecida = 14/partial ──
ok(SR.ageFit(60, 12, 215).inBand && SR.ageFit(60, 12, 215).points === 26, 'ageFit dentro da faixa = 26/inBand');
ok(SR.ageFit(null, 12, 215).known === false && SR.ageFit(null, 12, 215).points === 14, 'ageFit idade? = 14/known:false');
const aIn = SR.ageFit(60, 12, 215).points, aNear = SR.ageFit(220, 12, 215).points,
      aMid = SR.ageFit(230, 12, 215).points, aFar = SR.ageFit(260, 12, 215).points;
ok(aIn > aNear && aNear > aMid && aMid > aFar, `ageFit monotônico por distância de borda (${aIn}>${aNear}>${aMid}>${aFar})`);
ok(SR.ageFit(260, 12, 215).axis === 'no', 'ageFit muito longe = eixo "no"');
// borda, não ponto-médio: idade logo acima de uma faixa LARGA ainda é "perto"
ok(SR.ageFit(218, 6, 215).points >= 18, 'ageFit usa a borda (faixa larga não penaliza idade próxima do topo)');

// ── confOf: monotônico (parcial → boa → alta) com limiares 48 e 70 ──
ok(SR.confOf(70) === 'alta' && SR.confOf(69) === 'boa', 'confOf limiar alta = 70');
ok(SR.confOf(48) === 'boa' && SR.confOf(47) === 'parcial', 'confOf limiar boa = 48');
ok(SR.confOf(98) === 'alta' && SR.confOf(0) === 'parcial', 'confOf extremos');

// ── modalityOf: classifica sem lançar, default = escala ──
ok(SR.modalityOf({ direct_test: true }) === 'direto', 'modalityOf teste direto');
ok(SR.modalityOf({ audience: 'familia' }) === 'familia', 'modalityOf família');
ok(SR.modalityOf({ audience: 'escola' }) === 'escola', 'modalityOf escola');
ok(SR.modalityOf(null) === 'escala' && SR.modalityOf({}) === 'escala', 'modalityOf default = escala');

// ── pickTop: ≤ n, sem id repetido, ordenado desc, deduplica por assinatura ──
const ranked = [
  { s: { id: 'a', domain: 'X', age_band: '1', audience: 'familia' }, sc: 90 },
  { s: { id: 'b', domain: 'X', age_band: '1', audience: 'familia' }, sc: 80 }, // mesma assinatura de 'a'
  { s: { id: 'c', domain: 'Y', age_band: '2', audience: 'escola' }, sc: 70 },
  { s: { id: 'd', domain: 'Z', age_band: '3', direct_test: true }, sc: 60 },
];
const top = SR.pickTop(ranked, 3);
ok(top.length <= 3, `pickTop ≤ n (${top.length})`);
const ids = top.map((r) => r.s.id);
ok(new Set(ids).size === ids.length, 'pickTop sem id repetido');
ok(!ids.includes('b'), 'pickTop deduplica variante de mesma assinatura (b sai)');
const scs = top.map((r) => r.sc);
ok(scs.every((v, i) => i === 0 || scs[i - 1] >= v), 'pickTop ordenado por score desc');
ok(SR.pickTop(ranked, 1).length === 1, 'pickTop respeita n=1');
ok(SR.pickTop([], 3).length === 0, 'pickTop lista vazia = []');

// ── dedupAll / sig: assinatura determinística, remove variantes ──
ok(SR.sig({ domain: 'X', age_band: '1', audience: 'familia' }) === SR.sig({ domain: 'X', age_band: '1', audience: 'familia' }), 'sig determinística');
ok(SR.dedupAll(ranked).length === 3, 'dedupAll remove a variante de mesma assinatura (4→3)');

// ── relatório ──
console.log(`\n[engine-properties] ${pass}/${pass + fail} invariantes do motor OK` + (fail ? ` · ${fail} FALHA(S)` : ''));
if (fail) { console.error('  ✗ ' + fails.join('\n  ✗ ')); process.exit(1); }
console.log('✓ Motor de ranking: todas as invariantes (fit/idade/topo) se mantêm.\n');
process.exit(0);
