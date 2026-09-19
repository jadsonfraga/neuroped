/**
 * authorial-intake-gate.test.ts — o portão de ingestão autoral precisa recusar.
 *
 * Três instrumentos do autor estão fora do catálogo porque a fonte integral dos
 * itens não foi conferida. O risco que este portão existe para evitar não é
 * técnico: é alguém preencher os itens de memória e o aplicativo passar a
 * pontuar sobre enunciados que ninguém confrontou com a fonte.
 *
 * Todos os enunciados abaixo são sintéticos e não representam nenhum item real
 * dos instrumentos.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PENDING_AUTHORIAL_SOURCE_IDS,
  pendingAuthorialScaleIntakes,
} from "../../client/src/data/pendingAuthorialScaleIntake";
import {
  validateAuthorialIntake,
  type AuthorialIntakeCandidate,
} from "../../shared/authorialIntake";

let assertions = 0;
const check = (value: unknown, message: string) => {
  assert.ok(value, message);
  assertions++;
};
const recusa = (candidate: AuthorialIntakeCandidate, trecho: RegExp, message: string) => {
  const result = validateAuthorialIntake(candidate, expectation);
  check(!result.ok && result.errors.some((error) => trecho.test(error)), message);
};

const expectation = pendingAuthorialScaleIntakes.find((item) => item.id === "passo-16-sdg")!;
check(expectation?.expectedItems === 16, "o instrumento de referência do teste declara 16 itens");

/** Distribui enunciados sintéticos pelos domínios declarados, somando `total`. */
function candidatoSintetico(total: number, domains = expectation.knownDomains): AuthorialIntakeCandidate {
  const buckets = domains.map((name) => ({ name, items: [] as string[] }));
  for (let index = 0; index < total; index += 1) {
    buckets[index % buckets.length].items.push(
      `Enunciado sintetico de verificacao numero ${index + 1}, sem relacao com a fonte real.`,
    );
  }
  return {
    id: "passo-16-sdg",
    version: "1.0.0",
    source: "fonte-sintetica.pdf",
    sourceKind: "pdf",
    sourceSha256: "a".repeat(64),
    domains: buckets,
  };
}

// Caminho feliz: contagem exata, domínios exatos, fonte declarada.
{
  const result = validateAuthorialIntake(candidatoSintetico(16), expectation);
  check(result.ok && result.itemCount === 16, `candidato completo é aceito (${result.errors.join(" | ")})`);
}

// Contagem: nem um item a menos, nem um a mais.
recusa(candidatoSintetico(15), /contagem de itens divergente/, "15 itens são recusados");
recusa(candidatoSintetico(17), /contagem de itens divergente/, "17 itens são recusados");

// Domínios: conjunto exato, porque domínio diferente significa fonte diferente.
recusa(
  candidatoSintetico(16, expectation.knownDomains.slice(0, 3)),
  /domínios ausentes/,
  "domínio faltando é recusado",
);
recusa(
  candidatoSintetico(16, [...expectation.knownDomains, "domínio inventado"]),
  /não declarados/,
  "domínio a mais é recusado",
);

// Item que não veio de fonte.
{
  const vazio = candidatoSintetico(16);
  vazio.domains[0].items[0] = "   ";
  recusa(vazio, /está vazio/, "item vazio é recusado");

  const rascunho = candidatoSintetico(16);
  rascunho.domains[0].items[0] = "item 1";
  recusa(rascunho, /marcador de rascunho/, "numeração solta é recusada como item");

  const curto = candidatoSintetico(16);
  curto.domains[0].items[0] = "ok";
  recusa(curto, /curto demais/, "resto de extração é recusado como enunciado");

  // Contraprova do limiar: instrumento de autonomia tem item curto legítimo, e
  // recusá-lo bloquearia a ingestão correta.
  const curtoLegitimo = candidatoSintetico(16);
  curtoLegitimo.domains[0].items[0] = "come sozinho";
  check(
    validateAuthorialIntake(curtoLegitimo, expectation).ok,
    "item curto porém plausível de autonomia não é barrado pelo portão",
  );

  const repetido = candidatoSintetico(16);
  repetido.domains[1].items[0] = repetido.domains[0].items[0];
  recusa(repetido, /itens repetidos/, "item duplicado é recusado");

  const rotulo = candidatoSintetico(16);
  rotulo.domains[0].items[0] = rotulo.domains[0].name;
  recusa(rotulo, /repete o nome do domínio/, "item que copia o domínio é recusado");
}

// Proveniência: sem fonte conferível não há ingestão.
{
  const semHash = candidatoSintetico(16);
  semHash.sourceSha256 = "nao-e-hash";
  recusa(semHash, /SHA-256/, "digest inválido é recusado");

  const semFonte = candidatoSintetico(16);
  semFonte.source = "";
  recusa(semFonte, /source é obrigatório/, "candidato sem arquivo-fonte é recusado");

  const semVersao = candidatoSintetico(16);
  semVersao.version = "1.0";
  recusa(semVersao, /maior\.menor\.correção/, "versão malformada é recusada");

  const outroId = candidatoSintetico(16);
  outroId.id = "pronto-sdg-28";
  recusa(outroId, /não corresponde/, "candidato de outro instrumento é recusado");
}

// O portão não promove nada sozinho, e os três seguem fora do catálogo.
{
  check(PENDING_AUTHORIAL_SOURCE_IDS.size === 3, "os três instrumentos continuam aguardando fonte");
  for (const id of ["pronto-sdg-28", "elo-com-30", "passo-16-sdg"]) {
    check(PENDING_AUTHORIAL_SOURCE_IDS.has(id), `${id} permanece bloqueado`);
  }
  const catalogo = readFileSync("client/src/data/filterableCatalogBase.ts", "utf8");
  check(
    catalogo.includes("PENDING_AUTHORIAL_SOURCE_IDS.has(scale.id)"),
    "o catálogo continua excluindo os instrumentos sem fonte",
  );
  const script = readFileSync("scripts/ingest-authorial-scale.mts", "utf8");
  check(
    !/writeFileSync|appendFileSync|mkdirSync/.test(script),
    "o portão apenas confere: não escreve no repositório nem promove por conta própria",
  );
  const gate = readFileSync("shared/authorialIntake.ts", "utf8");
  check(
    !/PRONTO|ELO-COM|PASSO-16/i.test(gate),
    "o validador não carrega conteúdo de instrumento nenhum",
  );
}

console.log(`Portão de ingestão autoral: ${assertions} asserções passaram.`);
