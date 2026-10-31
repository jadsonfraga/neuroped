import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JORNADAS_ANUAIS, jornadaAnual } from "../../client/src/features/super-neuropad/jornadaAnual";
import { PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";

test("jornada anual tem cobertura exata dos 16 anos sem herança silenciosa", () => {
  assert.deepEqual(JORNADAS_ANUAIS.map((entry) => entry.idade), [...YEARS]);
  assert.equal(new Set(JORNADAS_ANUAIS.map((entry) => entry.titulo)).size, YEARS.length);
  for (const idade of YEARS) {
    const perfil = jornadaAnual(idade);
    assert.ok(perfil, `Sem jornada exclusiva para ${idade} anos`);
    assert.equal(perfil.idade, idade);
    assert.deepEqual(Object.keys(perfil.mundos).sort(), [...PHASE_ORDER].sort());
    for (const field of ["titulo", "convite", "apoio", "pausa", "fecho"] as const) {
      assert.ok(perfil[field].length >= 14, `${idade}: ${field} incompleto`);
    }
    for (const phase of PHASE_ORDER) assert.ok(perfil.mundos[phase].length > 20, `${idade}: ${phase} sem narrativa`);
  }
  for (const invalid of [-1, 1, 18, 99, 2.5, NaN, Infinity]) assert.equal(jornadaAnual(invalid), undefined);
});

test("acolhimento evolui sem exigir alfabetização ou infantilizar adolescente", () => {
  for (const idade of [2, 3, 4, 5, 6]) {
    const perfil = jornadaAnual(idade)!;
    assert.doesNotMatch(perfil.apoio, /deve ler|leitura obrigat[oó]ria|escrever sozinho/i);
  }
  for (const idade of [13, 14, 15, 16, 17]) {
    const perfil = jornadaAnual(idade)!;
    assert.match(perfil.apoio + " " + perfil.pausa, /privacidade|autonomia|adolescente|sem infantilizar|sem julgamento|recusa|comunica[cç][aã]o/i);
    assert.doesNotMatch(perfil.convite, /beb[eê]|princesa|m[aã]gica|papai|mam[aã]e/i);
  }
});

test("camada narrativa aparece apenas no preparo e nas transições, sem alterar critérios clínicos", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  const module = readFileSync("client/src/features/super-neuropad/jornadaAnual.ts", "utf8");
  assert.match(page, /data-testid="super-neuropad-jornada-anual"/);
  assert.match(page, /data-testid="super-neuropad-mundo-anual"/);
  assert.match(page, /jornada\.mundos\[phaseId\]/);
  assert.match(page, /<TouchStage key=\{item\.id\} item=\{item\}/);
  assert.match(page, /<JudgeStage key=\{item\.id\} item=\{item\}/);
  assert.match(page, /<BuildStage key=\{item\.id\} item=\{item\}/);
  assert.doesNotMatch(module, /\b(recordTouch|recordJudged|recordBuild|sessionStats|alterarPontuacao)\s*\(/);
});
