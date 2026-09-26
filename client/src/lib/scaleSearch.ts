/**
 * Busca de instrumentos v2 — motor puro, determinístico e testável.
 *
 * O que muda em relação à busca por substring (searchBoost legado):
 *  - Siglas com pontuação ("M-CHAT-R/F", "C-SSRS", "CY-BOCS", "PHQ-A") casam
 *    com o que a pessoa realmente digita ("mchat", "cssrs", "cybocs", "phqa").
 *  - Numerais romanos viram arábicos ("SNAP-IV" ⇄ "snap4", "Denver II" ⇄ "denver2").
 *  - Tolerância a erro de digitação limitada por tamanho (Damerau-Levenshtein
 *    com distância 1 para 4–6 letras e 2 a partir de 7), só contra nome,
 *    aliases e nome completo — nunca contra a descrição inteira.
 *  - Sinônimos clínicos e leigos ("não para quieto" → TDAH) e apelidos curados
 *    por instrumento (scaleSearchAliases) ampliam a consulta sem esconder a
 *    correspondência: cada acerto devolve o campo e o termo que casou.
 *  - Pesos por campo: nome exato > prefixo de nome > alias > nome completo >
 *    sinônimo de queixa > descrição > fonte. Todos os termos casando dá bônus.
 *  - "Você quis dizer": quando nada casa, sugere nomes e queixas próximos.
 *
 * O motor NÃO decide pertinência clínica. Segurança, idade, respondente e
 * bloqueios duros continuam em advancedFilterLogic; aqui só se decide o que a
 * pessoa quis encontrar entre candidatos que o motor clínico já aprovou.
 */

import { scaleSearchAliases, searchSynonymGroups } from "@/data/scaleSearchAliases";

export type SearchField =
  | "nome"
  | "alias"
  | "nome_completo"
  | "sigla"
  | "queixa"
  | "sinal"
  | "respondente"
  | "licenca"
  | "descricao"
  | "fonte"
  | "aproximado";

export interface SearchableScale {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  queixas: string[];
  respondente: string[];
  fonte?: string;
  signalTags?: string[];
  tipo?: string;
  licencaUso?: string;
  prioridade?: string;
}

export interface SearchMatchDetail {
  field: SearchField;
  /** Termo (já normalizado) que casou no instrumento. */
  term: string;
  /** Token da consulta responsável pelo acerto. */
  token: string;
  /** Distância de edição quando o acerto foi aproximado (0 = exato). */
  distance: number;
}

export interface ScaleSearchHit<T extends SearchableScale = SearchableScale> {
  scale: T;
  /** Pontuação bruta (0 = sem correspondência). */
  score: number;
  /** Bônus em escala 0–45 para somar ao score clínico (0–100). */
  boost: number;
  /** Todos os tokens da consulta encontraram algo neste instrumento. */
  allTokensMatched: boolean;
  /** Fração de tokens casados (0–1). */
  coverage: number;
  /** Melhor acerto por token (para explicar/realçar). */
  details: SearchMatchDetail[];
  /** Algum acerto dependeu de tolerância a erro de digitação. */
  fuzzy: boolean;
}

export interface ScaleSearchOptions {
  /** Limite de resultados (0 = todos). */
  limit?: number;
  /** Desliga a tolerância a erro de digitação (útil em testes de contrato). */
  fuzzy?: boolean;
}

// ──────────────────────────────── Normalização ────────────────────────────────

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "as", "os", "em", "no", "na",
  "nos", "nas", "com", "para", "por", "um", "uma", "of", "the", "and", "for",
  "in", "on", "to", "version", "versao", "escala", "scale", "questionario",
  "questionnaire", "inventario", "inventory", "checklist", "test", "teste",
  "protocolo", "protocol", "rating", "itens", "items", "item", "dr", "jadson",
  "nexus", "neuroped", "sdg", "autoral", "v1", "v2", "app",
]);

const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

/** Minúsculas, sem acento, "&"→"e", pontuação vira espaço. */
export function normalizeSearchText(value: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Forma compacta: só letras e dígitos ("M-CHAT-R/F" → "mchatrf"). */
export function compactKey(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

/** Numeral romano isolado vira arábico; o resto passa intacto. */
function romanToArabic(token: string): string {
  return ROMAN[token] ?? token;
}

/** Tokens de um texto, com variante arábica de numerais romanos. */
export function tokenize(value: string): string[] {
  const out: string[] = [];
  for (const raw of normalizeSearchText(value).split(" ")) {
    if (!raw) continue;
    out.push(raw);
    const arabic = romanToArabic(raw);
    if (arabic !== raw) out.push(arabic);
  }
  return out;
}

/** Tokens da consulta: descarta ruído de 1 caractere que não seja dígito. */
export function tokenizeQuery(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const dropped: string[] = [];
  for (const token of tokenize(query)) {
    if (token.length < 2 && !/^\d$/.test(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    if (STOPWORDS.has(token)) dropped.push(token);
    else out.push(token);
  }
  // Consulta feita só de palavras genéricas ("escala", "teste") ainda busca.
  return out.length ? out : dropped;
}

/** Sigla a partir das iniciais do nome completo ("Childhood Autism Rating Scale 2" → "cars2", "cars"). */
export function acronymsOf(fullName: string): string[] {
  const words = normalizeSearchText(fullName).split(" ").filter(Boolean);
  const letters: string[] = [];
  const digits: string[] = [];
  for (const word of words) {
    if (/^\d+$/.test(word)) {
      digits.push(word);
      continue;
    }
    const arabic = romanToArabic(word);
    if (arabic !== word) {
      digits.push(arabic);
      continue;
    }
    if (STOPWORDS.has(word) && word.length <= 3) continue;
    letters.push(word[0]);
  }
  if (letters.length < 2) return [];
  const base = letters.join("");
  const out = [base];
  if (digits.length) out.push(base + digits.join(""));
  return out;
}

// ─────────────────────────── Distância de edição ───────────────────────────

/** Damerau-Levenshtein (alinhamento ótimo de strings) com corte antecipado. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i += 1) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prev2[j - 2] + 1);
      }
      cur.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

/** Distância tolerada por tamanho do token digitado. */
export function allowedDistance(token: string): number {
  if (token.length >= 7) return 2;
  if (token.length >= 4) return 1;
  return 0;
}

// ────────────────────────────────── Índice ──────────────────────────────────

interface IndexedScale<T extends SearchableScale> {
  scale: T;
  compactName: string;
  compactId: string;
  nameTokens: string[];
  aliasTokens: string[];
  aliasCompact: string[];
  acronyms: string[];
  fullNameTokens: string[];
  fullNameCompact: string;
  queixaTokens: string[];
  signalTokens: string[];
  respondentTokens: string[];
  licenseTokens: string[];
  descriptionTokens: Set<string>;
  fonteTokens: Set<string>;
}

const RESPONDENT_WORDS: Record<string, string[]> = {
  pais: ["pais", "mae", "pai", "cuidador", "familia", "responsavel"],
  professor: ["professor", "professora", "escola", "escolar", "creche"],
  clinico: ["clinico", "medico", "observacao", "entrevista"],
  autoaplicavel: ["autoaplicavel", "autorrelato", "adolescente", "proprio"],
  crianca: ["crianca"],
  teste_direto_crianca: ["direto", "teste", "crianca"],
};

const LICENSE_WORDS: Record<string, string[]> = {
  livre: ["livre", "gratuito", "gratis", "free"],
  autoral: ["autoral", "gratuito", "gratis", "nexus"],
  comercial: ["comercial", "pago", "licenciado", "licenca"],
  restrita: ["restrita", "licenciado", "licenca"],
  contato_autor: ["autor", "licenciado"],
};

const indexCache = new WeakMap<object, IndexedScale<SearchableScale>>();

function indexScale<T extends SearchableScale>(scale: T): IndexedScale<T> {
  const cached = indexCache.get(scale);
  if (cached) return cached as IndexedScale<T>;
  const aliases = scaleSearchAliases[scale.id] ?? [];
  const nameTokens = uniq(tokenize(scale.name));
  const aliasTokens = uniq(aliases.flatMap((alias) => tokenize(alias)));
  const aliasCompact = uniq(aliases.map(compactKey).filter(Boolean));
  const fullNameTokens = uniq(tokenize(scale.fullName));
  const compactName = compactKey(scale.name);
  const compactNameArabic = tokenize(scale.name).join("");
  const indexed: IndexedScale<T> = {
    scale,
    compactName,
    compactId: compactKey(scale.id),
    nameTokens,
    aliasTokens,
    aliasCompact: uniq([...aliasCompact, compactNameArabic]),
    acronyms: acronymsOf(scale.fullName),
    fullNameTokens,
    fullNameCompact: compactKey(scale.fullName),
    queixaTokens: uniq((scale.queixas ?? []).map((q) => normalizeSearchText(q))),
    signalTokens: uniq((scale.signalTags ?? []).flatMap((tag) => tokenize(tag))),
    respondentTokens: uniq((scale.respondente ?? []).flatMap((r) => RESPONDENT_WORDS[r] ?? [normalizeSearchText(r)])),
    licenseTokens: scale.licencaUso ? LICENSE_WORDS[scale.licencaUso] ?? [normalizeSearchText(scale.licencaUso)] : [],
    descriptionTokens: new Set(tokenize(`${scale.description ?? ""} ${scale.tipo ?? ""}`)),
    fonteTokens: new Set(tokenize(scale.fonte ?? "")),
  };
  indexCache.set(scale, indexed as IndexedScale<SearchableScale>);
  return indexed;
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

// ───────────────────────────── Expansão de sinônimos ─────────────────────────

interface Expansion {
  term: string;
  /** Peso relativo (1 = literal, <1 = sinônimo). */
  weight: number;
  via?: string;
}

const synonymIndex: Map<string, { group: string[]; key: string }[]> = (() => {
  const map = new Map<string, { group: string[]; key: string }[]>();
  for (const [key, members] of Object.entries(searchSynonymGroups)) {
    const group = uniq([normalizeSearchText(key), ...members.map(normalizeSearchText)]);
    for (const member of group) {
      const list = map.get(member) ?? [];
      list.push({ group, key: normalizeSearchText(key) });
      map.set(member, list);
    }
  }
  return map;
})();

/**
 * Expande cada token da consulta com sinônimos do dicionário. Expressões
 * compostas ("nao para quieto") são reconhecidas na consulta inteira.
 */
export function expandQuery(query: string): {
  tokens: string[];
  expansions: Map<string, Expansion[]>;
  /** Tokens da consulta absorvidos por uma expressão composta reconhecida. */
  phraseCovered: Set<string>;
} {
  const normalized = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);
  const expansions = new Map<string, Expansion[]>();
  const phraseHits = new Set<string>();
  const phraseCovered = new Set<string>();
  // Expressões compostas na consulta inteira.
  for (const [member, entries] of synonymIndex) {
    if (member.includes(" ") && ` ${normalized} `.includes(` ${member} `)) {
      for (const entry of entries) phraseHits.add(entry.key);
      for (const part of member.split(" ")) phraseCovered.add(part);
    }
  }
  for (const token of tokens) {
    const list: Expansion[] = [{ term: token, weight: 1 }];
    for (const entry of synonymIndex.get(token) ?? []) {
      for (const member of entry.group) {
        if (member !== token) list.push({ term: member, weight: 0.6, via: entry.key });
      }
    }
    expansions.set(token, dedupeExpansions(list));
  }
  if (phraseHits.size) {
    const phraseToken = "__frase__";
    const list: Expansion[] = [];
    for (const key of phraseHits) {
      for (const entry of synonymIndex.get(key) ?? []) {
        for (const member of entry.group) list.push({ term: member, weight: 0.7, via: key });
      }
    }
    if (list.length) {
      tokens.push(phraseToken);
      expansions.set(phraseToken, dedupeExpansions(list));
    }
  }
  return { tokens, expansions, phraseCovered };
}

function dedupeExpansions(list: Expansion[]): Expansion[] {
  const best = new Map<string, Expansion>();
  for (const item of list) {
    const cur = best.get(item.term);
    if (!cur || cur.weight < item.weight) best.set(item.term, item);
  }
  return [...best.values()];
}

// ─────────────────────────────────── Score ───────────────────────────────────

const WEIGHT: Record<SearchField, number> = {
  nome: 120,
  sigla: 100,
  alias: 90,
  nome_completo: 55,
  queixa: 45,
  sinal: 40,
  respondente: 28,
  licenca: 25,
  descricao: 20,
  fonte: 10,
  aproximado: 0,
};

interface FieldHit {
  field: SearchField;
  term: string;
  score: number;
  distance: number;
}

function bestFieldHit<T extends SearchableScale>(
  idx: IndexedScale<T>,
  term: string,
  weight: number,
  fuzzy: boolean,
): FieldHit | null {
  const compactTerm = term.replace(/\s+/g, "");
  let best: FieldHit | null = null;
  const consider = (field: SearchField, matched: string, score: number, distance = 0) => {
    const value = Math.round(score * weight);
    if (value <= 0) return;
    if (!best || value > best.score) best = { field, term: matched, score: value, distance };
  };

  // Nome/sigla exatos ou por prefixo (forma compacta absorve pontuação).
  if (compactTerm.length >= 2) {
    if (idx.compactName === compactTerm || idx.compactId === compactTerm) consider("nome", idx.scale.name, WEIGHT.nome);
    else if (compactTerm.length >= 3 && idx.compactName.startsWith(compactTerm)) consider("nome", idx.scale.name, WEIGHT.nome * 0.75);
    else if (compactTerm.length >= 4 && idx.compactName.includes(compactTerm)) consider("nome", idx.scale.name, WEIGHT.nome * 0.55);
    for (const alias of idx.aliasCompact) {
      if (alias === compactTerm) consider("alias", alias, WEIGHT.alias);
      else if (compactTerm.length >= 3 && alias.startsWith(compactTerm)) consider("alias", alias, WEIGHT.alias * 0.7);
    }
    for (const acronym of idx.acronyms) {
      if (acronym === compactTerm) consider("sigla", acronym, WEIGHT.sigla);
    }
  }
  // Dígito solto ("2", "3") só conta dentro da forma compacta ("cars2",
  // "conners3"); como token isolado casaria com qualquer versão numerada.
  const digitOnly = /^\d+$/.test(term);
  for (const token of idx.nameTokens) {
    if (digitOnly) break;
    if (token === term) consider("nome", token, WEIGHT.nome * 0.7);
    else if (term.length >= 3 && token.startsWith(term)) consider("nome", token, WEIGHT.nome * 0.5);
  }
  for (const token of idx.aliasTokens) {
    if (digitOnly) break;
    if (token === term) consider("alias", token, WEIGHT.alias * 0.7);
    else if (term.length >= 4 && token.startsWith(term)) consider("alias", token, WEIGHT.alias * 0.5);
  }
  if (compactTerm.length >= 5 && idx.fullNameCompact.includes(compactTerm)) consider("nome_completo", idx.scale.fullName, WEIGHT.nome_completo * 0.8);
  for (const token of idx.fullNameTokens) {
    if (digitOnly) break;
    if (token === term) consider("nome_completo", token, WEIGHT.nome_completo);
    else if (term.length >= 4 && token.startsWith(term)) consider("nome_completo", token, WEIGHT.nome_completo * 0.6);
  }
  // Instrumento focado (poucas queixas) vale mais que um catch-all marcado com tudo.
  const focus = idx.queixaTokens.length <= 4 ? 1 : idx.queixaTokens.length <= 8 ? 0.85 : 0.7;
  for (const token of idx.queixaTokens) {
    if (token === term) consider("queixa", token, WEIGHT.queixa * focus);
  }
  for (const token of idx.signalTokens) {
    if (token === term) consider("sinal", token, WEIGHT.sinal);
    else if (term.length >= 5 && token.startsWith(term)) consider("sinal", token, WEIGHT.sinal * 0.6);
  }
  for (const token of idx.respondentTokens) {
    if (token === term) consider("respondente", token, WEIGHT.respondente);
  }
  for (const token of idx.licenseTokens) {
    if (token === term) consider("licenca", token, WEIGHT.licenca);
  }
  // Descrição/fonte só para termos com substância (dígito solto "2" ou "10"
  // casaria com quase tudo — ruído puro).
  const substantive = term.length >= 3 && !/^\d+$/.test(term);
  if (substantive && idx.descriptionTokens.has(term)) consider("descricao", term, WEIGHT.descricao);
  else if (substantive && term.length >= 5) {
    for (const token of idx.descriptionTokens) {
      if (token.startsWith(term)) {
        consider("descricao", token, WEIGHT.descricao * 0.7);
        break;
      }
    }
  }
  if (substantive && idx.fonteTokens.has(term)) consider("fonte", term, WEIGHT.fonte);

  // Aproximação (erro de digitação) — só nome, aliases e nome completo.
  if (!best && fuzzy) {
    const max = allowedDistance(term);
    if (max > 0) {
      let bestDistance = max + 1;
      let bestToken = "";
      let bestField: SearchField = "nome";
      const probe = (tokens: string[], field: SearchField) => {
        for (const token of tokens) {
          if (token.length < 4) continue;
          const distance = editDistance(term, token, max);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestToken = token;
            bestField = field;
          }
        }
      };
      probe(idx.nameTokens, "nome");
      probe([idx.compactName, ...idx.aliasCompact, ...idx.aliasTokens], "alias");
      probe(idx.fullNameTokens, "nome_completo");
      if (bestDistance <= max) {
        const base = bestField === "nome" ? 70 : bestField === "alias" ? 60 : 40;
        consider("aproximado", bestToken, (base - 12 * bestDistance) / weight, bestDistance);
        if (best) (best as FieldHit).field = "aproximado";
      }
    }
  }
  return best;
}

/**
 * Termos de CONTEXTO (população/respondente/custo): ajudam a ordenar, mas não
 * decidem sozinhos e não penalizam a cobertura quando ausentes — "ansiedade
 * adolescente" continua sendo, antes de tudo, uma busca por ansiedade.
 */
const CONTEXT_GROUP_KEYS = new Set(["pais", "professor", "autoaplicavel", "clinico", "gratuito"]);
const CONTEXT_TERMS = new Set([
  "adolescente", "adolescentes", "crianca", "criancas", "bebe", "bebes", "lactente", "lactentes",
  "infantil", "infantojuvenil", "pediatrico", "pediatrica", "escolar", "escolares", "pre", "adulto",
  "adultos", "anos", "meses", "ano", "mes", "menino", "menina", "filho", "filha",
]);
const CONTEXT_CAP = 30;
/** Abaixo disto, um acerto parcial é ruído (ex.: só a descrição casou 1 de 3 termos). */
const MIN_SCORE = 12;
const DOMAIN_CAP = WEIGHT.queixa;
const PRIMARY_QUEIXA_BONUS = 20;

function groupKeyOf(token: string): string | undefined {
  return synonymIndex.get(token)?.[0]?.key;
}

/**
 * Busca no catálogo. Sem consulta útil, devolve todos com score 0 (ordem
 * preservada) — o chamador decide se filtra.
 */
export function searchScaleCatalog<T extends SearchableScale>(
  scales: readonly T[],
  query: string,
  options: ScaleSearchOptions = {},
): ScaleSearchHit<T>[] {
  const fuzzy = options.fuzzy !== false;
  const { tokens, expansions, phraseCovered } = expandQuery(query);
  if (tokens.length === 0) {
    return scales.map((scale) => ({ scale, score: 0, boost: 0, allTokensMatched: false, coverage: 0, details: [], fuzzy: false }));
  }
  const compactQuery = compactKey(query);
  const contentTokens = tokens.filter((token) => {
    if (token === "__frase__") return false;
    const key = groupKeyOf(token);
    return !(CONTEXT_TERMS.has(token) || (key && CONTEXT_GROUP_KEYS.has(key)));
  });
  const contentCount = Math.max(1, contentTokens.length);
  const hits: ScaleSearchHit<T>[] = [];
  for (const scale of scales) {
    const idx = indexScale(scale);
    let score = 0;
    let matchedContent = 0;
    let matchedAny = 0;
    let anyFuzzy = false;
    let phraseMatched = false;
    const details: SearchMatchDetail[] = [];
    for (const token of tokens) {
      let best: FieldHit | null = null;
      let bestVia: string | undefined;
      for (const expansion of expansions.get(token) ?? []) {
        const hit = bestFieldHit(idx, expansion.term, expansion.weight, fuzzy && expansion.weight === 1);
        if (hit && (!best || hit.score > best.score)) {
          best = hit;
          bestVia = expansion.via;
        }
      }
      if (!best) continue;
      const isPhrase = token === "__frase__";
      const isContent = contentTokens.includes(token);
      const matchedIsContext = CONTEXT_TERMS.has(best.term) || CONTEXT_TERMS.has(best.term.split(" ")[0] ?? "");
      const groupKey = bestVia ?? groupKeyOf(token) ?? groupKeyOf(best.term);
      let tokenScore = best.score;
      if ((!isContent && !isPhrase) || (matchedIsContext && best.field !== "nome")) {
        tokenScore = Math.min(tokenScore, CONTEXT_CAP);
      } else if (groupKey) {
        // Termo de domínio (queixa/sinônimo): nome que só repete o domínio
        // não supera por muito o instrumento cuja queixa PRINCIPAL é esse
        // domínio. Nome/apelido literal (sem passar por sinônimo) mantém uma
        // vantagem pequena; acerto via sinônimo/descrição fica no teto.
        const literalName = !bestVia && best.distance === 0 && (best.field === "nome" || best.field === "alias" || best.field === "sigla");
        tokenScore = Math.min(tokenScore, literalName ? DOMAIN_CAP + PRIMARY_QUEIXA_BONUS + 5 : DOMAIN_CAP);
        if (idx.queixaTokens[0] === groupKey) tokenScore += PRIMARY_QUEIXA_BONUS;
      }
      matchedAny += 1;
      if (isContent) matchedContent += 1;
      if (isPhrase) phraseMatched = true;
      score += tokenScore;
      if (best.field === "aproximado") anyFuzzy = true;
      const shownToken = isPhrase ? best.term : bestVia && bestVia !== token ? token : token;
      details.push({ field: best.field, term: best.term, token: shownToken, distance: best.distance });
    }
    // Consulta inteira compactada casa nome/alias ("m chat", "snap iv", "cy bocs").
    if (compactQuery.length >= 3 && tokens.length > 1) {
      if (idx.compactName === compactQuery || idx.aliasCompact.includes(compactQuery)) {
        score += WEIGHT.nome;
        matchedContent = contentCount;
        matchedAny = Math.max(matchedAny, 1);
        details.unshift({ field: "nome", term: idx.scale.name, token: compactQuery, distance: 0 });
      } else if (idx.compactName.startsWith(compactQuery)) {
        score += WEIGHT.nome * 0.6;
        matchedContent = contentCount;
        matchedAny = Math.max(matchedAny, 1);
        details.unshift({ field: "nome", term: idx.scale.name, token: compactQuery, distance: 0 });
      }
    }
    if (matchedAny === 0) continue;
    if (phraseMatched) {
      // "xixi na cama" reconhecido como expressão cobre seus próprios tokens.
      const covered = contentTokens.filter((token) => phraseCovered.has(token)).length;
      matchedContent = Math.min(contentCount, Math.max(matchedContent, covered));
    }
    const coverage = contentTokens.length ? matchedContent / contentCount : 1;
    const allTokensMatched = matchedContent >= contentTokens.length;
    // Cobertura parcial reduz proporcionalmente; cobertura total ganha bônus.
    const finalScore = Math.round(score * (allTokensMatched ? 1.25 : coverage * coverage));
    if (finalScore < MIN_SCORE) continue;
    hits.push({
      scale,
      score: finalScore,
      boost: Math.min(45, Math.round(finalScore * 0.3)),
      allTokensMatched,
      coverage,
      details,
      fuzzy: anyFuzzy,
    });
  }
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      priorityRank(a.scale) - priorityRank(b.scale) ||
      a.scale.name.length - b.scale.name.length ||
      a.scale.name.localeCompare(b.scale.name),
  );
  return options.limit && options.limit > 0 ? hits.slice(0, options.limit) : hits;
}

function priorityRank(scale: SearchableScale): number {
  if (scale.prioridade === "triagem") return 0;
  if (scale.prioridade === "diagnostica") return 1;
  return 2;
}

// ───────────────────────────── "Você quis dizer" ─────────────────────────────

export interface SearchSuggestion {
  /** Texto pronto para a pessoa clicar. */
  label: string;
  kind: "instrumento" | "queixa" | "termo";
  /** Id do instrumento ou da queixa, quando aplicável. */
  id?: string;
  distance: number;
}

export function suggestSearchCorrections<T extends SearchableScale>(
  scales: readonly T[],
  query: string,
  complaints: readonly { id: string; label: string; terms?: readonly string[] }[] = [],
  limit = 3,
): SearchSuggestion[] {
  const tokens = tokenizeQuery(query).filter((token) => token !== "__frase__" && token.length >= 3);
  if (!tokens.length) return [];
  // Agrupa por palavra corrigida: "epilepsa" → "epilepsia" gera UMA sugestão
  // (a queixa, mais ampla), não três instrumentos cujo apelido contém a palavra.
  const KIND_RANK: Record<SearchSuggestion["kind"], number> = { queixa: 0, instrumento: 1, termo: 2 };
  const byCorrected = new Map<string, SearchSuggestion & { corrected: string }>();
  const offer = (corrected: string, label: string, kind: SearchSuggestion["kind"], distance: number, id?: string) => {
    const current = byCorrected.get(corrected);
    const candidate = { label, kind, distance, id, corrected };
    if (!current || distance < current.distance || (distance === current.distance && KIND_RANK[kind] < KIND_RANK[current.kind])) {
      byCorrected.set(corrected, candidate);
    }
  };
  for (const token of tokens) {
    const max = Math.max(1, Math.min(2, Math.floor(token.length / 3)));
    for (const scale of scales) {
      const idx = indexScale(scale);
      const probes = [idx.compactName, ...idx.nameTokens, ...idx.aliasCompact, ...idx.aliasTokens, ...idx.acronyms];
      for (const probe of probes) {
        if (probe.length < 3) continue;
        const distance = editDistance(token, probe, max);
        if (distance <= max) offer(probe, scale.name, "instrumento", distance, scale.id);
      }
    }
    for (const complaint of complaints) {
      const probes = uniq([...tokenize(complaint.label), ...(complaint.terms ?? []).flatMap((t) => tokenize(t))]);
      for (const probe of probes) {
        if (probe.length < 4) continue;
        const distance = editDistance(token, probe, max);
        if (distance <= max) offer(probe, complaint.label, "queixa", distance, complaint.id);
      }
    }
    for (const [member] of synonymIndex) {
      if (member.length < 4 || member.includes(" ")) continue;
      const distance = editDistance(token, member, max);
      if (distance > 0 && distance <= max) offer(member, member, "termo", distance);
    }
  }
  const seen = new Set<string>();
  return [...byCorrected.values()]
    .sort((a, b) => a.distance - b.distance || KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.label.localeCompare(b.label))
    .filter((item) => {
      const key = `${item.kind}:${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ label, kind, distance, id }) => ({ label, kind, distance, id }));
}

// ─────────────────────────────── Explicação/realce ───────────────────────────

const FIELD_LABEL: Record<SearchField, string> = {
  nome: "nome",
  sigla: "sigla",
  alias: "apelido",
  nome_completo: "nome completo",
  queixa: "queixa",
  sinal: "sinal clínico",
  respondente: "respondente",
  licenca: "licença",
  descricao: "descrição",
  fonte: "fonte",
  aproximado: "grafia próxima",
};

/** Frase curta em português explicando por que o instrumento casou. */
export function describeSearchHit(hit: Pick<ScaleSearchHit, "details" | "fuzzy">): string {
  if (!hit.details.length) return "";
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const detail of hit.details) {
    const label = FIELD_LABEL[detail.field];
    const via = detail.token && detail.token !== detail.term ? ` (você digitou “${detail.token}”)` : "";
    const text = detail.field === "aproximado"
      ? `grafia próxima de “${detail.term}”${via}`
      : `${label} “${detail.term}”${via}`;
    if (!seen.has(text)) {
      seen.add(text);
      parts.push(text);
    }
    if (parts.length >= 3) break;
  }
  return `Correspondeu por ${parts.join(" · ")}`;
}

export interface HighlightSegment {
  text: string;
  hit: boolean;
}

/** Divide um texto em trechos marcando as ocorrências dos termos casados. */
export function highlightSegments(text: string, terms: readonly string[]): HighlightSegment[] {
  const clean = terms.map((t) => normalizeSearchText(t)).filter((t) => t.length >= 2);
  if (!text || !clean.length) return [{ text, hit: false }];
  // Mapa posição-normalizada → posição-original para preservar acentos/pontuação.
  const original = text;
  const chars: { norm: string; index: number }[] = [];
  for (let i = 0; i < original.length; i += 1) {
    const n = original[i].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const mapped = /[a-z0-9]/.test(n) ? n : " ";
    chars.push({ norm: mapped, index: i });
  }
  const normString = chars.map((c) => c.norm).join("");
  const compactString = chars.filter((c) => c.norm !== " ").map((c) => c.norm).join("");
  const compactIndexes = chars.filter((c) => c.norm !== " ").map((c) => c.index);
  const ranges: [number, number][] = [];
  for (const term of clean) {
    const compactTerm = term.replace(/\s+/g, "");
    let from = 0;
    let found = normString.indexOf(term, from);
    if (found === -1 && compactTerm.length >= 3) {
      let at = compactString.indexOf(compactTerm);
      while (at !== -1) {
        ranges.push([compactIndexes[at], compactIndexes[at + compactTerm.length - 1] + 1]);
        at = compactString.indexOf(compactTerm, at + 1);
      }
      continue;
    }
    while (found !== -1) {
      ranges.push([found, found + term.length]);
      from = found + term.length;
      found = normString.indexOf(term, from);
    }
  }
  if (!ranges.length) return [{ text, hit: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  const out: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) out.push({ text: original.slice(cursor, start), hit: false });
    out.push({ text: original.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < original.length) out.push({ text: original.slice(cursor), hit: false });
  return out;
}

/** Termos a realçar a partir de um acerto (nome/alias/nome completo apenas). */
export function highlightTermsOf(hit: Pick<ScaleSearchHit, "details">): string[] {
  const out: string[] = [];
  for (const detail of hit.details) {
    if (detail.field === "nome" || detail.field === "alias" || detail.field === "nome_completo" || detail.field === "aproximado" || detail.field === "sigla") {
      out.push(detail.term);
      if (detail.token && detail.token !== detail.term) out.push(detail.token);
    }
  }
  return uniq(out);
}
