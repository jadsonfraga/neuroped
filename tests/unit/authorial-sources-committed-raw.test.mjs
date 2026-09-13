/**
 * O catálogo autoral commitado precisa continuar cru.
 *
 * client/src/data/authorialMonitoring.ts espalha as três fontes no import
 * (`[...source, ...channelSource, ...mcriSource]`) e valida o resultado. Já
 * scripts/prepare_authorial_delivery_sources.py funde as três em
 * authorialMonitoring.json e aplica os overlays aprovados — é um estado de
 * entrega, descartável, produzido dentro do runner.
 *
 * Commitar essa saída faz o módulo lançar "id duplicado" no import e derruba o
 * catálogo de escalas do app inteiro. Hoje isso só aparece como falha obscura
 * de um teste vizinho; este guard falha antes, dizendo o que aconteceu.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ler = (arquivo) =>
  JSON.parse(readFileSync(resolve(process.cwd(), "client/src/data", arquivo), "utf8"));

const fontes = {
  "authorialMonitoring.json": ler("authorialMonitoring.json"),
  "authorialMonitoringChannel2026.json": ler("authorialMonitoringChannel2026.json"),
  "authorialMonitoringMcri2026.json": ler("authorialMonitoringMcri2026.json"),
};

const chaveNome = (valor) =>
  String(valor ?? "").normalize("NFKC").trim().toLocaleLowerCase("pt-BR");

const remedio =
  "restaure com `git checkout -- client/src/data/authorialMonitoring.json`: " +
  "a saída de prepare_authorial_delivery_sources.py nunca é commitada.";

for (const [arquivo, registros] of Object.entries(fontes)) {
  assert.ok(Array.isArray(registros) && registros.length > 0, `${arquivo}: lista autoral vazia.`);
  for (const registro of registros) {
    assert.ok(
      !("deliveryReview" in registro),
      `${arquivo}: ${registro.id} carrega deliveryReview, um artefato de entrega — ${remedio}`,
    );
  }
}

// As fontes são espalhadas lado a lado no import; ids e nomes repetidos entre
// elas fazem validateMonitoringRecords lançar antes de qualquer tela montar.
const vistosId = new Map();
const vistosNome = new Map();
for (const [arquivo, registros] of Object.entries(fontes)) {
  for (const registro of registros) {
    const anteriorId = vistosId.get(registro.id);
    assert.ok(
      anteriorId === undefined,
      `id ${registro.id} aparece em ${anteriorId} e em ${arquivo} — ${remedio}`,
    );
    vistosId.set(registro.id, arquivo);

    const nome = chaveNome(registro.name);
    const anteriorNome = vistosNome.get(nome);
    assert.ok(
      anteriorNome === undefined,
      `nome "${registro.name}" aparece em ${anteriorNome} e em ${arquivo} — ${remedio}`,
    );
    vistosNome.set(nome, arquivo);
  }
}

console.log(
  `✓ fontes autorais commitadas seguem cruas e disjuntas (${vistosId.size} instrumentos em ${Object.keys(fontes).length} arquivos)`,
);
