/**
 * O catálogo autoral commitado precisa continuar cru.
 *
 * client/src/data/authorialMonitoring.ts espalha as três fontes no import
 * (`[...source, ...channelSource, ...mcriSource]`) e valida o conjunto. Já
 * scripts/prepare_authorial_delivery_sources.py funde as três em
 * authorialMonitoring.json e aplica os overlays aprovados — estado de entrega,
 * descartável, produzido dentro do runner.
 *
 * Commitar essa saída faz validateMonitoringRecords lançar "id duplicado" no
 * import: o catálogo de escalas do app não carrega, e o build do cliente quebra
 * com um erro que não menciona a causa. Este guard roda antes do build e à
 * frente da cadeia de testes, para que a primeira falha já diga o que houve.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ARQUIVOS_AUTORAIS = [
  "authorialMonitoring.json",
  "authorialMonitoringChannel2026.json",
  "authorialMonitoringMcri2026.json",
];

const REMEDIO =
  "restaure com `git checkout -- client/src/data/authorialMonitoring.json`: " +
  "a saída de prepare_authorial_delivery_sources.py nunca é commitada.";

const chaveNome = (valor) =>
  String(valor ?? "").normalize("NFKC").trim().toLocaleLowerCase("pt-BR");

export function lerFontesAutorais(raiz = process.cwd()) {
  return Object.fromEntries(
    ARQUIVOS_AUTORAIS.map((arquivo) => [
      arquivo,
      JSON.parse(readFileSync(resolve(raiz, "client/src/data", arquivo), "utf8")),
    ]),
  );
}

/** Lança no primeiro sinal de catálogo preparado; devolve o total de instrumentos. */
export function assertAuthorialSourcesRaw(fontes = lerFontesAutorais()) {
  for (const [arquivo, registros] of Object.entries(fontes)) {
    if (!Array.isArray(registros) || registros.length === 0) {
      throw new Error(`${arquivo}: lista autoral vazia.`);
    }
    for (const registro of registros) {
      if (registro && typeof registro === "object" && "deliveryReview" in registro) {
        throw new Error(
          `${arquivo}: ${registro.id} carrega deliveryReview, um artefato de entrega — ${REMEDIO}`,
        );
      }
    }
  }

  // As fontes são espalhadas lado a lado no import; id ou nome repetido entre
  // elas faz validateMonitoringRecords lançar antes de qualquer tela montar.
  const vistosId = new Map();
  const vistosNome = new Map();
  for (const [arquivo, registros] of Object.entries(fontes)) {
    for (const registro of registros) {
      const anteriorId = vistosId.get(registro.id);
      if (anteriorId !== undefined) {
        throw new Error(`id ${registro.id} aparece em ${anteriorId} e em ${arquivo} — ${REMEDIO}`);
      }
      vistosId.set(registro.id, arquivo);

      const nome = chaveNome(registro.name);
      const anteriorNome = vistosNome.get(nome);
      if (anteriorNome !== undefined) {
        throw new Error(
          `nome "${registro.name}" aparece em ${anteriorNome} e em ${arquivo} — ${REMEDIO}`,
        );
      }
      vistosNome.set(nome, arquivo);
    }
  }

  return vistosId.size;
}

const executadoDiretamente =
  process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;

if (executadoDiretamente) {
  try {
    const total = assertAuthorialSourcesRaw();
    console.log(
      `✓ fontes autorais commitadas seguem cruas e disjuntas (${total} instrumentos em ${ARQUIVOS_AUTORAIS.length} arquivos)`,
    );
  } catch (erro) {
    console.error(`✗ catálogo autoral preparado detectado: ${erro.message}`);
    process.exit(1);
  }
}
