/**
 * Estado do Filtro Clínico na URL (deep-link compartilhável).
 *
 * Um colega recebe `#/filtro?idade=5a6m&queixas=tea,linguagem&resp=pais` e
 * abre os mesmos filtros estruturados. O texto livre não é compartilhado. Regras:
 *  - Só chaves próprias (FILTER_URL_KEYS) são lidas/escritas; `autoral` (aba)
 *    e `mode=flash` ficam intactos.
 *  - Leitura aceita a query no hash (`#/filtro?...`) e na query real
 *    (`/?...#/filtro`), como readRouteParam.
 *  - Escrita usa replaceState (sem empilhar histórico nem disparar rota).
 *  - Texto livre pode conter dados de paciente: `q` é somente de entrada,
 *    por compatibilidade; nunca é serializado e é removido na próxima escrita.
 *    A URL gerada contém apenas os filtros estruturados do aplicativo.
 *  - Valores inválidos são ignorados um a um (fail-closed por campo).
 */

export const FILTER_URL_KEYS = ["q", "queixas", "faixa", "idade", "resp", "com", "alf", "tipo", "sinais", "tempo"] as const;
export type FilterUrlKey = (typeof FILTER_URL_KEYS)[number];

export const FILTER_URL_RESPONDENTS = ["pais", "professor", "clinico", "autoaplicavel", "teste_direto_crianca"] as const;
export type FilterUrlRespondent = (typeof FILTER_URL_RESPONDENTS)[number];

export interface FilterUrlState {
  /** Alguma chave própria estava presente e válida. */
  present: boolean;
  search?: string;
  queixas?: string[];
  ageBand?: string;
  exactAge?: { years: string; months: string };
  respondente?: FilterUrlRespondent;
  communication?: "verbal" | "nonverbal";
  literacy?: "literate" | "preliterate";
  assessmentType?: "diagnostic" | "monitoring";
  signals?: string[];
  timeBudget?: number;
}

export interface FilterUrlValidators {
  queixaIds: ReadonlySet<string>;
  ageBandIds: ReadonlySet<string>;
}

const MAX_SEARCH = 300;
const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,80}$/;

function listParam(value: string | null, validate: (id: string) => boolean): string[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && SAFE_ID.test(item) && validate(item));
  return ids.length ? [...new Set(ids)].slice(0, 12) : undefined;
}

/** "5a6m" | "5a" | "18m" → { years, months } válidos (0–18 anos, 0–11 meses). */
export function parseUrlExactAge(value: string | null): { years: string; months: string } | undefined {
  if (!value) return undefined;
  const match = value.trim().toLowerCase().match(/^(?:(\d{1,2})a)?(?:(\d{1,2})m)?$/);
  if (!match || (match[1] === undefined && match[2] === undefined)) return undefined;
  let years = match[1] !== undefined ? Number(match[1]) : 0;
  let months = match[2] !== undefined ? Number(match[2]) : 0;
  // "18m" (só meses) é normalizado para os campos do app (meses 0–11).
  if (match[1] === undefined && months > 11) {
    years = Math.floor(months / 12);
    months %= 12;
  }
  if (months > 11 || years * 12 + months > 216) return undefined;
  const hasYears = match[1] !== undefined || years > 0;
  return { years: hasYears ? String(years) : "", months: match[2] !== undefined ? String(months) : "" };
}

export function formatUrlExactAge(age: { years: string; months: string } | undefined): string | undefined {
  if (!age) return undefined;
  const years = age.years.trim();
  const months = age.months.trim();
  if (!years && !months) return undefined;
  if (!/^\d{0,3}$/.test(years) || !/^\d{0,3}$/.test(months)) return undefined;
  return `${years ? `${Number(years)}a` : ""}${months ? `${Number(months)}m` : ""}`;
}

export function parseFilterUrlParams(params: URLSearchParams, validators: FilterUrlValidators): FilterUrlState {
  const state: FilterUrlState = { present: false };
  const q = params.get("q");
  if (q && q.trim()) {
    state.search = q.trim().slice(0, MAX_SEARCH);
    state.present = true;
  }
  const queixas = listParam(params.get("queixas"), (id) => validators.queixaIds.has(id));
  if (queixas) {
    state.queixas = queixas;
    state.present = true;
  }
  const faixa = params.get("faixa")?.trim();
  if (faixa && validators.ageBandIds.has(faixa)) {
    state.ageBand = faixa;
    state.present = true;
  }
  const exactAge = parseUrlExactAge(params.get("idade"));
  if (exactAge) {
    state.exactAge = exactAge;
    // Idade exata tem prioridade sobre faixa (mesma regra de resolveFilterAge).
    delete state.ageBand;
    state.present = true;
  }
  const resp = params.get("resp")?.trim() as FilterUrlRespondent | undefined;
  if (resp && (FILTER_URL_RESPONDENTS as readonly string[]).includes(resp)) {
    state.respondente = resp;
    state.present = true;
  }
  const com = params.get("com")?.trim();
  if (com === "verbal" || com === "nonverbal") {
    state.communication = com;
    state.present = true;
  }
  const alf = params.get("alf")?.trim();
  if (alf === "literate" || alf === "preliterate") {
    state.literacy = alf;
    state.present = true;
  }
  const tipo = params.get("tipo")?.trim();
  if (tipo === "diagnostic" || tipo === "monitoring") {
    state.assessmentType = tipo;
    state.present = true;
  }
  const signals = listParam(params.get("sinais"), () => true);
  if (signals) {
    state.signals = signals;
    state.present = true;
  }
  const tempo = params.get("tempo")?.trim();
  if (tempo && /^\d{1,3}$/.test(tempo)) {
    const minutes = Number(tempo);
    if (minutes >= 1 && minutes <= 180) {
      state.timeBudget = minutes;
      state.present = true;
    }
  }
  return state;
}

export function serializeFilterUrlParams(state: Omit<FilterUrlState, "present">): URLSearchParams {
  const params = new URLSearchParams();
  // Não propagar texto livre para histórico, favoritos ou links copiados.
  // `q` continua em FILTER_URL_KEYS para limpar links legados ao reescrever.
  if (state.queixas?.length) params.set("queixas", state.queixas.join(","));
  const idade = formatUrlExactAge(state.exactAge);
  if (idade) params.set("idade", idade);
  else if (state.ageBand) params.set("faixa", state.ageBand);
  if (state.respondente) params.set("resp", state.respondente);
  if (state.communication) params.set("com", state.communication);
  if (state.literacy) params.set("alf", state.literacy);
  if (state.assessmentType) params.set("tipo", state.assessmentType);
  if (state.signals?.length) params.set("sinais", state.signals.join(","));
  if (state.timeBudget && state.timeBudget > 0) params.set("tempo", String(Math.round(state.timeBudget)));
  return params;
}

/** Query do hash (`#/filtro?...`) mesclada com a query real; o hash prevalece. */
export function currentFilterUrlParams(href: string): URLSearchParams {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return new URLSearchParams();
  }
  const merged = new URLSearchParams(url.search);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const rawQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  for (const [key, value] of new URLSearchParams(rawQuery)) merged.set(key, value);
  return merged;
}

export function readFilterUrlState(validators: FilterUrlValidators): FilterUrlState {
  if (typeof window === "undefined") return { present: false };
  return parseFilterUrlParams(currentFilterUrlParams(window.location.href), validators);
}

/**
 * Reescreve a URL com o estado atual, preservando todo parâmetro alheio.
 * Devolve a URL resultante (para teste); em navegador, aplica replaceState.
 */
export function buildFilterUrl(href: string, state: Omit<FilterUrlState, "present">): string {
  const url = new URL(href);
  for (const key of FILTER_URL_KEYS) url.searchParams.delete(key);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const [rawPath, rawQuery = ""] = hash.split("?");
  const query = new URLSearchParams(rawQuery);
  for (const key of FILTER_URL_KEYS) query.delete(key);
  for (const [key, value] of serializeFilterUrlParams(state)) query.set(key, value);
  const path = rawPath || "/filtro";
  url.hash = `${path.startsWith("/") ? path : `/${path}`}${query.toString() ? `?${query}` : ""}`;
  return url.href;
}

export function writeFilterUrlState(state: Omit<FilterUrlState, "present">): void {
  if (typeof window === "undefined") return;
  try {
    const next = buildFilterUrl(window.location.href, state);
    if (next !== window.location.href) window.history.replaceState(window.history.state, "", next);
  } catch {
    /* URL inválida ou history indisponível — deep-link é conveniência, nunca bloqueia o filtro */
  }
}
