import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAgeRangeMonths } from "../../client/src/lib/ageRangeParse.ts";

// Auditoria semanal do filtro (P1): o parser antigo do registro mundial
// falhava ABERTO — "0 a 6 anos" (sem travessão) virava {0, 216} e 77 das 112
// linhas ganhavam faixa fabricada de 0–18 anos. Este gate trava as duas
// metades da correção: semântica fiel do parser e registro 100% parseável.

// ── Semântica: unidades, composições, envelopes, teto pediátrico ──
assert.deepEqual(parseAgeRangeMonths("6–18 anos"), { min: 72, max: 216 });
assert.deepEqual(parseAgeRangeMonths("0 a 6 anos"), { min: 0, max: 72 });
assert.deepEqual(parseAgeRangeMonths("Nascimento a 68 meses"), { min: 0, max: 68 });
assert.deepEqual(parseAgeRangeMonths("1 a 66 meses"), { min: 1, max: 66 });
assert.deepEqual(parseAgeRangeMonths("2,5–6 anos"), { min: 30, max: 72 });
assert.deepEqual(parseAgeRangeMonths("Nascimento a 7 anos e 11 meses"), { min: 0, max: 84 });
// parêntese é detalhamento — o texto principal governa
assert.deepEqual(parseAgeRangeMonths("16 dias a 42 meses (4 anos e 2 meses)"), { min: 1, max: 42 });
// múltiplas faixas ⇒ envelope
assert.deepEqual(
  parseAgeRangeMonths("ASQ-3: 1 a 66 meses; ASQ:SE-2: 1 a 72 meses"),
  { min: 1, max: 72 },
);
// limite inferior aberto e teto adulto recortados no universo pediátrico
assert.deepEqual(parseAgeRangeMonths("≥ 4 anos"), { min: 48, max: 216 });
assert.deepEqual(parseAgeRangeMonths("≥ 18 meses (qualquer idade)"), { min: 18, max: 216 });
assert.deepEqual(parseAgeRangeMonths("8–89 anos (CPT-3)"), { min: 96, max: 216 });
assert.deepEqual(parseAgeRangeMonths("2,5 a adultos"), { min: 30, max: 216 });
// valor único com unidade = ponto etário conservador
assert.deepEqual(parseAgeRangeMonths("18 meses"), { min: 18, max: 18 });
// prosa populacional sem número = sem restrição etária pediátrica
assert.deepEqual(parseAgeRangeMonths("Todas as idades"), { min: 0, max: 216 });
assert.deepEqual(
  parseAgeRangeMonths("Crianças e adolescentes com síndrome de Tourette"),
  { min: 0, max: 216 },
);

// ── Fail-closed: ilegível NUNCA vira faixa ──
assert.equal(parseAgeRangeMonths(""), null);
assert.equal(parseAgeRangeMonths("faixa a definir"), null);
assert.equal(parseAgeRangeMonths(undefined), null);
// população exclusivamente adulta fica fora do app
assert.equal(parseAgeRangeMonths("19 a 89 anos"), null);

// ── O registro comprometido parseia INTEIRO (CI reprova dado novo ilegível) ──
const registry = JSON.parse(
  readFileSync(
    "client/public/data/neuroped_escalas_neuropsiquiatria_infantil_100.json",
    "utf8",
  ),
) as { escalas?: unknown[][] };
const rows = registry.escalas ?? [];
assert.ok(rows.length >= 100, `registro com ${rows.length} linhas (< 100)`);
const unparseable: string[] = [];
for (const row of rows) {
  const idade = String(row[4] ?? "");
  const parsed = parseAgeRangeMonths(idade);
  if (!parsed) {
    unparseable.push(`${row[1]}: "${idade}"`);
    continue;
  }
  assert.ok(
    parsed.min >= 0 && parsed.min <= parsed.max && parsed.max <= 216,
    `faixa insana em ${row[1]}: ${JSON.stringify(parsed)}`,
  );
}
assert.deepEqual(
  unparseable,
  [],
  "linhas do registro sem faixa parseável (fail-closed: corrija o dado, não o parser às cegas)",
);

// Regressão nominal do pior caso antigo: Bayley não pode voltar a "0–18 anos".
const bayley = rows.find((row) => /bayley/i.test(String(row[1] ?? "")));
if (bayley) {
  const parsed = parseAgeRangeMonths(String(bayley[4]));
  assert.ok(parsed && parsed.max <= 48, `Bayley com teto ${parsed?.max} meses (> 48)`);
}

console.log(
  `✓ Faixas do registro mundial: parser fail-closed, ${rows.length}/${rows.length} linhas parseáveis, Bayley contido na primeira infância`,
);
