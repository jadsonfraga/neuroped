/**
 * Sugestões enquanto a pessoa digita na busca do Filtro Clínico.
 *
 * Padrão de referência: NN/g (sugestões são esperadas, não opcionais),
 * Baymard (≤ 8 no celular, destacar o que difere do digitado, correção de
 * grafia no topo, sugestão "de escopo" com estilo próprio) e W3C APG
 * (combobox + listbox, teclado). Este módulo é puro: recebe o catálogo já
 * aprovado pelo motor clínico (candidatos seguros) e o catálogo inteiro, e
 * devolve uma lista curta e explicável. A UI decide como renderizar.
 *
 * Regras:
 *  - Instrumentos SEGUROS para o perfil vêm primeiro; instrumentos que casam
 *    mas estão fora do perfil (idade/respondente) entram no fim, marcados —
 *    nunca escondidos e nunca confundidos com recomendação.
 *  - Queixas que casam com o texto viram sugestão "Marcar queixa", para a
 *    pessoa migrar da busca livre para o filtro estruturado.
 *  - Sem acerto, a correção de grafia aparece primeiro.
 */
import {
  searchScaleCatalog,
  suggestSearchCorrections,
  highlightTermsOf,
  normalizeSearchText,
  type SearchableScale,
} from "@/lib/scaleSearch";

export interface AutocompleteComplaint {
  id: string;
  label: string;
  terms?: readonly string[];
}

export type AutocompleteKind = "instrumento" | "fora_do_perfil" | "queixa" | "correcao";

export interface AutocompleteItem<T extends SearchableScale = SearchableScale> {
  id: string;
  kind: AutocompleteKind;
  /** Texto principal (nome do instrumento, rótulo da queixa ou grafia corrigida). */
  label: string;
  /** Linha secundária (nome completo, faixa etária, "marcar como queixa"). */
  detail?: string;
  /** Termos a realçar no rótulo. */
  highlight: string[];
  scale?: T;
  complaintId?: string;
}

export interface AutocompleteOptions<T extends SearchableScale = SearchableScale> {
  /** Máximo de itens (padrão 8). */
  limit?: number;
  /** Formata a faixa etária de um instrumento para a linha secundária. */
  formatAge?: (scale: T) => string;
}

function complaintMatches(complaint: AutocompleteComplaint, query: string): boolean {
  const tokens = normalizeSearchText(query).split(" ").filter((t) => t.length >= 2);
  if (!tokens.length) return false;
  const words = normalizeSearchText([complaint.id, complaint.label, ...(complaint.terms ?? [])].join(" ")).split(" ");
  return tokens.every((token) => words.some((word) => (token.length < 3 ? word === token : word.startsWith(token))));
}

export function buildAutocomplete<T extends SearchableScale>(
  query: string,
  safeCatalog: readonly T[],
  fullCatalog: readonly T[],
  complaints: readonly AutocompleteComplaint[],
  options: AutocompleteOptions<T> = {},
): AutocompleteItem<T>[] {
  const limit = options.limit ?? 8;
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const items: AutocompleteItem<T>[] = [];
  const seen = new Set<string>();
  const formatAge = options.formatAge ?? ((): string => "");

  const safeHits = searchScaleCatalog(safeCatalog, trimmed, { limit: limit });
  for (const hit of safeHits) {
    if (items.length >= limit - 1) break;
    if (seen.has(hit.scale.id)) continue;
    seen.add(hit.scale.id);
    items.push({
      id: `instrumento:${hit.scale.id}`,
      kind: "instrumento",
      label: hit.scale.name,
      detail: [hit.scale.fullName, formatAge(hit.scale)].filter(Boolean).join(" · "),
      highlight: highlightTermsOf(hit),
      scale: hit.scale,
    });
  }

  // Queixas que casam: no máximo 2, para não roubar espaço dos instrumentos.
  let complaintCount = 0;
  for (const complaint of complaints) {
    if (complaintCount >= 2 || items.length >= limit) break;
    if (!complaintMatches(complaint, trimmed)) continue;
    complaintCount += 1;
    items.push({
      id: `queixa:${complaint.id}`,
      kind: "queixa",
      label: complaint.label,
      detail: "Marcar como queixa e filtrar pelo motor clínico",
      highlight: normalizeSearchText(trimmed).split(" ").filter(Boolean),
      complaintId: complaint.id,
    });
  }

  // Fora do perfil: casa no catálogo inteiro, mas não passou nos filtros
  // clínicos atuais. Entra no fim, marcado, só quando sobra espaço.
  if (items.length < limit) {
    const safeIds = new Set(safeCatalog.map((s) => s.id));
    const outside = searchScaleCatalog(
      fullCatalog.filter((s) => !safeIds.has(s.id)),
      trimmed,
      { limit: 3 },
    );
    for (const hit of outside) {
      if (items.length >= limit) break;
      if (seen.has(hit.scale.id)) continue;
      seen.add(hit.scale.id);
      items.push({
        id: `fora:${hit.scale.id}`,
        kind: "fora_do_perfil",
        label: hit.scale.name,
        detail: [formatAge(hit.scale), "fora do perfil atual (idade/respondente)"].filter(Boolean).join(" · "),
        highlight: highlightTermsOf(hit),
        scale: hit.scale,
      });
    }
  }

  // Nenhum instrumento casou em lugar nenhum: correção de grafia no topo.
  if (!items.some((item) => item.kind === "instrumento" || item.kind === "fora_do_perfil")) {
    const corrections = suggestSearchCorrections(fullCatalog, trimmed, complaints, 3);
    const fixes: AutocompleteItem<T>[] = corrections.map((c) => ({
      id: `correcao:${c.kind}:${c.label}`,
      kind: c.kind === "queixa" ? "queixa" : "correcao",
      label: c.label,
      detail: c.kind === "queixa" ? "Marcar como queixa" : "Você quis dizer",
      highlight: [],
      complaintId: c.kind === "queixa" ? c.id : undefined,
      scale: c.kind === "instrumento" ? fullCatalog.find((s) => s.id === c.id) : undefined,
    }));
    return [...fixes, ...items.filter((item) => !fixes.some((f) => f.id === item.id))].slice(0, limit);
  }
  return items.slice(0, limit);
}

/** Navegação por teclado no listbox (APG combobox): devolve o novo índice ativo. */
export function moveActiveIndex(current: number, count: number, key: "ArrowDown" | "ArrowUp" | "Home" | "End"): number {
  if (count <= 0) return -1;
  switch (key) {
    case "ArrowDown":
      return current >= count - 1 ? 0 : current + 1;
    case "ArrowUp":
      return current <= 0 ? count - 1 : current - 1;
    case "Home":
      return 0;
    case "End":
      return count - 1;
  }
}
