// Congela o que o app coleta e aplica (itens, ordem, pseudopalavras, textos, formas A/B, tempos, validade do rascunho)
// para provar que a remoção de cortes/níveis não mudou a coleta. Não congela nenhuma classificação (não existe).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { descritivoGolden } from "../tools/golden-descritivo";

test("coleta e administração congeladas: itens, ordem, textos, formas A/B, tempos e rascunho de 72 h", () => {
  const expected = JSON.parse(readFileSync(new URL("../fixtures/golden-descritivo.json", import.meta.url), "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(descritivoGolden())), expected);
  assert.equal(expected.rascunhoValidadeHoras, 72);
  assert.deepEqual(expected.iced.ditadoPseudo.slice(0, 5), ["mepa", "tulo", "falito", "bruneca", "crenuto"]);
  assert.equal(expected.iced.ditadoPseudo.length, 10);
  assert.equal(expected.jogoLetrasNumeros.jln.length, 6);
  assert.ok(expected.jogoLetrasNumeros.jln.every((band: { compreensaoA: string; compreensaoB: string }) => band.compreensaoA !== band.compreensaoB), "textos de compreensão A e B distintos");
  assert.deepEqual(Object.keys(expected.superNeuropad).map(Number), Array.from({ length: 16 }, (_, i) => i + 2));
});

test("o golden não contém corte, nível nem classificação", () => {
  const text = readFileSync(new URL("../fixtures/golden-descritivo.json", import.meta.url), "utf8");
  assert.doesNotMatch(text, /nivel|nível|esperado|alerta|corte|elevada|intermediaria|observar|limiar/i);
});
