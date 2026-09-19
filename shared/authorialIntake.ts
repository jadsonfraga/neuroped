/*
 * authorialIntake.ts — porta de entrada verificável de um instrumento autoral.
 *
 * Três instrumentos do autor estão deliberadamente fora do catálogo porque a
 * fonte integral dos itens não está disponível para conferência. A conduta
 * correta é essa: um instrumento não pode ser reconstruído de memória, de
 * resumo ou de nome de domínio.
 *
 * Este módulo não desbloqueia nada sozinho e não gera item nenhum. Ele é o
 * portão: recebe um candidato já extraído da fonte pelo autor, confere contra
 * o que o repositório declara esperar daquele instrumento e recusa tudo que
 * não bata. Passar aqui é condição necessária para promoção, nunca suficiente
 * — a promoção continua sendo edição revisada por pessoa.
 */

export interface AuthorialIntakeExpectation {
  id: string;
  title: string;
  expectedItems: number;
  knownDomains: string[];
}

export interface AuthorialIntakeDomain {
  name: string;
  items: string[];
}

export interface AuthorialIntakeCandidate {
  id: string;
  /** Versão do instrumento, no formato maior.menor.correção. */
  version: string;
  /** Nome do arquivo-fonte conferido pelo autor. */
  source: string;
  sourceKind: "pdf" | "authored-app";
  /** SHA-256 do arquivo-fonte, em hexadecimal minúsculo. */
  sourceSha256: string;
  domains: AuthorialIntakeDomain[];
}

export interface AuthorialIntakeResult {
  ok: boolean;
  errors: string[];
  itemCount: number;
}

const SHA256_HEX = /^[0-9a-f]{64}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * Marcadores de item que não veio de fonte: numeração solta, reticências,
 * rascunho.
 */
const DRAFT_MARKER = /^(todo|tbd|xxx|placeholder|item\s*\d+|quest[ãa]o\s*\d+|\.{2,}|-+)$/i;

/**
 * Piso deliberadamente baixo. Instrumentos de autonomia têm itens curtos e
 * legítimos ("come sozinho", "veste-se"), então julgar enunciado por
 * comprimento recusaria fonte verdadeira — falha pior que a que se quer
 * evitar, porque bloqueia a ingestão correta. Este limite só derruba resto de
 * extração ("ok", "sim", "1"); a qualidade do enunciado é do autor, não deste
 * portão.
 */
const MIN_ITEM_LENGTH = 6;

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

/**
 * Confere o candidato contra a expectativa declarada no repositório.
 *
 * Nenhuma checagem aqui é cosmética: cada uma existe porque a falha
 * correspondente produziria um instrumento que pontua sobre itens que ninguém
 * conferiu contra a fonte.
 */
export function validateAuthorialIntake(
  candidate: AuthorialIntakeCandidate,
  expectation: AuthorialIntakeExpectation,
): AuthorialIntakeResult {
  const errors: string[] = [];

  if (candidate.id !== expectation.id) {
    errors.push(`id do candidato (${candidate.id}) não corresponde ao instrumento esperado (${expectation.id})`);
  }
  if (!SEMVER.test(candidate.version)) {
    errors.push(`version deve ser maior.menor.correção, recebido ${JSON.stringify(candidate.version)}`);
  }
  if (!candidate.source?.trim()) {
    errors.push("source é obrigatório: sem nome de arquivo-fonte não há o que conferir");
  }
  if (!SHA256_HEX.test(candidate.sourceSha256 ?? "")) {
    errors.push("sourceSha256 deve ser um SHA-256 hexadecimal de 64 caracteres, em minúsculas");
  }
  if (candidate.sourceKind !== "pdf" && candidate.sourceKind !== "authored-app") {
    errors.push("sourceKind deve ser 'pdf' ou 'authored-app'");
  }

  const domains = Array.isArray(candidate.domains) ? candidate.domains : [];
  if (domains.length === 0) errors.push("o candidato não traz nenhum domínio");

  // Domínios: conjunto exato. Um domínio a mais significa fonte diferente da
  // declarada; um a menos significa extração incompleta.
  const candidateDomains = domains.map((domain) => normalize(domain.name ?? ""));
  const expectedDomains = expectation.knownDomains.map(normalize);
  const faltando = expectedDomains.filter((name) => !candidateDomains.includes(name));
  const sobrando = candidateDomains.filter((name) => !expectedDomains.includes(name));
  if (faltando.length) errors.push(`domínios ausentes no candidato: ${faltando.join("; ")}`);
  if (sobrando.length) errors.push(`domínios não declarados para este instrumento: ${sobrando.join("; ")}`);
  if (candidateDomains.length !== new Set(candidateDomains).size) {
    errors.push("há domínios repetidos no candidato");
  }

  const items = domains.flatMap((domain) => (Array.isArray(domain.items) ? domain.items : []));
  const itemCount = items.length;
  if (itemCount !== expectation.expectedItems) {
    errors.push(
      `contagem de itens divergente: o repositório espera ${expectation.expectedItems} e o candidato traz ${itemCount}`,
    );
  }

  for (const [index, item] of items.entries()) {
    const text = typeof item === "string" ? item.trim() : "";
    if (!text) {
      errors.push(`item ${index + 1} está vazio`);
      continue;
    }
    if (DRAFT_MARKER.test(text)) {
      errors.push(`item ${index + 1} é marcador de rascunho, não item de fonte: ${JSON.stringify(text)}`);
      continue;
    }
    if (text.length < MIN_ITEM_LENGTH) {
      errors.push(`item ${index + 1} é curto demais para ser enunciado de fonte: ${JSON.stringify(text)}`);
    }
  }

  const normalizedItems = items.map((item) => normalize(typeof item === "string" ? item : ""));
  const repetidos = normalizedItems.filter((item, index) => item && normalizedItems.indexOf(item) !== index);
  if (repetidos.length) {
    errors.push(`itens repetidos no candidato: ${[...new Set(repetidos)].length} ocorrência(s)`);
  }
  // Um item que apenas repete o nome do domínio é rótulo copiado, não item.
  for (const domain of domains) {
    const domainName = normalize(domain.name ?? "");
    for (const item of domain.items ?? []) {
      if (normalize(typeof item === "string" ? item : "") === domainName) {
        errors.push(`um item do domínio ${JSON.stringify(domain.name)} apenas repete o nome do domínio`);
      }
    }
  }

  return { ok: errors.length === 0, errors, itemCount };
}
