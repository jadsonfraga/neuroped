/**
 * Contrato do guard que mantém o catálogo autoral commitado cru.
 *
 * Cobre os dois sentidos: o estado real do repositório passa, e o estado
 * produzido por prepare_authorial_delivery_sources.py falha com diagnóstico
 * que nomeia arquivo, instrumento e remédio — sem depender de rodar o prepare.
 */
import assert from "node:assert/strict";
import {
  ARQUIVOS_AUTORAIS,
  assertAuthorialSourcesRaw,
  lerFontesAutorais,
} from "../../scripts/guards/assert-authorial-sources-raw.mjs";

const fontes = lerFontesAutorais();
const total = assertAuthorialSourcesRaw(fontes);
assert.ok(total > 0, "as fontes autorais commitadas devem conter instrumentos.");

const clonar = (valor) => JSON.parse(JSON.stringify(valor));
const [principal, canal] = ARQUIVOS_AUTORAIS;

// Assinatura 1: o prepare aplica overlays e injeta deliveryReview nos registros.
const comOverlay = clonar(fontes);
comOverlay[principal][0].deliveryReview = {
  predecessorFingerprint: "sha256:fixture",
  deliveryContentChanged: false,
};
assert.throws(
  () => assertAuthorialSourcesRaw(comOverlay),
  (erro) =>
    erro.message.includes("deliveryReview") &&
    erro.message.includes(principal) &&
    erro.message.includes("git checkout --"),
  "registro commitado com deliveryReview deve falhar nomeando o remédio.",
);

// Assinatura 2: o prepare funde as três fontes na primeira, duplicando ids.
const fundido = clonar(fontes);
fundido[principal] = [...fundido[principal], ...clonar(fontes[canal])];
assert.throws(
  () => assertAuthorialSourcesRaw(fundido),
  (erro) => erro.message.includes(fontes[canal][0].id) && erro.message.includes(canal),
  "id repetido entre fontes deve falhar apontando os dois arquivos.",
);

// Nome duplicado quebra validateMonitoringRecords do mesmo jeito que id.
const nomeRepetido = clonar(fontes);
nomeRepetido[canal][0].name = fontes[principal][0].name;
assert.throws(
  () => assertAuthorialSourcesRaw(nomeRepetido),
  (erro) => erro.message.includes("nome"),
  "nome repetido entre fontes deve falhar.",
);

console.log(
  `✓ guard de fontes autorais cruas cobre overlay, id e nome (${total} instrumentos em ${ARQUIVOS_AUTORAIS.length} arquivos)`,
);
