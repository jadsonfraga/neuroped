/**
 * GET /api/memory/search?q=termo
 * Cloudflare Pages Function — Busca em notas de memória clínica
 *
 * Estratégias de busca (em ordem de prioridade):
 *  1. FTS5 (Full-Text Search nativo do SQLite/D1) — mais rápida quando disponível
 *  2. Busca textual com scoring TF-IDF simplificado — fallback confiável
 * Sem banco, falha fechada: nunca apresenta conteúdo fictício como memória salva.
 *
 * Busca semântica real (Vectorize + Workers AI) ainda não implementada.
 * Quando disponível, substituir a estratégia 2 por embeddings.
 *
 * LGPD: notas vinculadas a paciente obedecem ao mesmo owner do prontuário.
 * Notas globais/legadas com patient_id NULL ficam restritas ao administrador.
 */

import {
  getContextUser,
  isAdmin,
} from "../auth/_authorization";

interface Env {
  DB?: D1Database;
  AI?: Ai;               // Cloudflare Workers AI (futuro)
  VECTORIZE?: Vectorize; // Cloudflare Vectorize (futuro)
}

interface MemoryNote {
  id: string;
  title: string | null;
  content: string;
  category: string | null;
  source: string | null;
  tags: string | null;
  created_at: string;
  score?: number;
}

const MEMORY_SEARCH_LIMITS = {
  query: 300,
  category: 80,
  results: 20,
} as const;

function validationError(message: string): Response {
  return Response.json(
    { error: message, code: "VALIDATION_ERROR" },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function parseResultLimit(value: string | null): number | null {
  if (value === null) return 10;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  return Math.min(MEMORY_SEARCH_LIMITS.results, Math.max(1, parsed));
}

function parseMinimumScore(value: string | null): number | null {
  if (value === null) return 0.05;
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return null;
  return parsed;
}

// ============================================================
// TF-IDF simplificado para scoring de relevância textual
// ============================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")     // remove acentos
    .replace(/[^a-z0-9\s]/g, " ")        // remove pontuação
    .split(/\s+/)
    .filter((t) => t.length > 2);         // remove stopwords curtas
}

/** Calcula TF (term frequency) para um termo em um documento */
function tf(term: string, tokens: string[]): number {
  const count = tokens.filter((t) => t === term).length;
  return count / (tokens.length || 1);
}

/** Boost por matches exatos de multi-palavra na query */
function phraseBoost(query: string, text: string): number {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const t = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return t.includes(q) ? 0.5 : 0;
}

/**
 * Pontua uma nota com base na query.
 * Retorna score 0-1 (0 = irrelevante, 1 = muito relevante).
 */
function scoreNote(query: string, note: MemoryNote): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  let tagText = "";
  if (note.tags) {
    try {
      const parsedTags: unknown = JSON.parse(note.tags);
      if (Array.isArray(parsedTags)) {
        tagText = parsedTags.filter((tag): tag is string => typeof tag === "string").join(" ");
      }
    } catch {
      // Uma nota legada com tags malformadas não deve derrubar toda a busca.
    }
  }

  const fieldWeights = [
    { text: note.title ?? "", weight: 3.0 },
    { text: note.content, weight: 1.0 },
    { text: note.category ?? "", weight: 2.0 },
    { text: tagText, weight: 1.5 },
  ];

  let totalScore = 0;

  for (const { text, weight } of fieldWeights) {
    const tokens = tokenize(text);
    for (const qToken of queryTokens) {
      const termTf = tf(qToken, tokens);
      if (termTf > 0) {
        totalScore += termTf * weight;
      }
    }
    // Boost por frase exata
    totalScore += phraseBoost(query, text) * weight;
  }

  // Normaliza para [0, 1]
  const maxPossible = queryTokens.length * (3.0 + 1.0 + 2.0 + 1.5) + 0.5 * (3.0 + 1.0 + 2.0 + 1.5);
  return Math.min(1, totalScore / maxPossible);
}

// ============================================================
// Handler principal
// ============================================================

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limit = parseResultLimit(url.searchParams.get("limit"));
  const category = url.searchParams.get("category")?.trim();
  const minScore = parseMinimumScore(url.searchParams.get("min_score"));

  if (!query) {
    return Response.json({
      results: [],
      total: 0,
      searchType: "none",
      semanticSearchStatus: "idle",
      error: "Parâmetro 'q' é obrigatório.",
    }, { status: 400 });
  }
  if (query.length > MEMORY_SEARCH_LIMITS.query) {
    return validationError(
      `'q' deve ter no máximo ${MEMORY_SEARCH_LIMITS.query} caracteres.`,
    );
  }
  if (category && category.length > MEMORY_SEARCH_LIMITS.category) {
    return validationError(
      `'category' deve ter no máximo ${MEMORY_SEARCH_LIMITS.category} caracteres.`,
    );
  }
  if (limit === null) {
    return validationError("'limit' deve ser um número inteiro válido.");
  }
  if (minScore === null) {
    return validationError("'min_score' deve ser um número entre 0 e 1.");
  }

  const hasVectorize = !!env.VECTORIZE;
  const hasAI = !!env.AI;

  // ============================================================
  // SEM BANCO: falha fechada, sem memória fictícia
  // ============================================================
  if (!env.DB) {
    return Response.json({
      results: [],
      total: 0,
      query,
      category: category ?? null,
      searchType: "unavailable",
      semanticSearchStatus: "unavailable",
      error: "Memória persistente indisponível.",
      code: "DB_REQUIRED",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const user = getContextUser(context);
  if (!user) {
    return Response.json(
      { error: "Não autenticado.", code: "UNAUTHENTICATED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  // IN exclui patient_id NULL de forma deliberada: conteúdo global/legado só
  // pode ser pesquisado pelo administrador, evitando vazamento entre contas.
  const ownershipClause = isAdmin(user)
    ? ""
    : `AND n.patient_id IN (
         SELECT p.id FROM patients_demo p
          WHERE p.owner_user_id = ? AND p.is_demo = 1
       )`;
  const ownershipBinds = isAdmin(user) ? [] : [user.id];

  // ============================================================
  // BUSCA SEMÂNTICA (futuro — Vectorize + Workers AI)
  // ============================================================
  if (hasVectorize && hasAI) {
    // Placeholder honesto — implementar quando Vectorize estiver provisionado
    // Passos futuros:
    //   1. const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: query });
    //   2. const matches = await env.VECTORIZE.query(embedding.data[0], { topK: limit });
    //   3. Mapear IDs para memory_notes via D1
    // Por ora, cai no fallback textual e documenta honestamente:
    console.info("[memory/search] Vectorize disponível mas busca semântica não implementada. Usando FTS5.");
  }

  // ============================================================
  // BUSCA FTS5 (D1 nativo — mais rápida quando disponível)
  // ============================================================
  try {
    const categoryClause = category ? "AND n.category = ?" : "";
    const ftsBinds: unknown[] = [query];
    if (category) ftsBinds.push(category);
    ftsBinds.push(...ownershipBinds);
    ftsBinds.push(limit);

    const ftsRows = await env.DB
      .prepare(
        `SELECT n.id, n.title, n.content, n.category, n.source, n.tags, n.created_at,
                bm25(memory_notes_fts) * -1 AS score
         FROM memory_notes_fts
         JOIN memory_notes n ON memory_notes_fts.rowid = n.rowid
         WHERE memory_notes_fts MATCH ?
           AND n.is_demo = 1 ${categoryClause}
           ${ownershipClause}
         ORDER BY score DESC
         LIMIT ?`
      )
      .bind(...ftsBinds)
      .all();

    if (ftsRows.results && ftsRows.results.length > 0) {
      const numericScores = (ftsRows.results as any[]).map((row) => {
        const score = Number(row.score);
        return Number.isFinite(score) ? Math.max(0, score) : 0;
      });
      const maxFtsScore = Math.max(...numericScores, 0);
      const results = (ftsRows.results as any[])
        .map((row, index) => ({
          ...row,
          score: maxFtsScore > 0
            ? Math.min(1, numericScores[index] / maxFtsScore)
            : 0,
        }))
        .filter((row) => row.score >= minScore)
        .slice(0, limit);

      return Response.json({
        results,
        total: results.length,
        query,
        category: category ?? null,
        searchType: "fts5",
        semanticSearchStatus: hasVectorize && hasAI ? "configured_pending_implementation" : "not_configured",
        searchStatusNote: "Busca FTS5 nativa do SQLite (ranking BM25).",
      }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (ftsErr) {
    // FTS5 pode não estar disponível ou virtual table pode não ter sido criada
    console.warn("[memory/search] FTS5 indisponível, usando TF-IDF:", ftsErr);
  }

  // ============================================================
  // FALLBACK — Busca LIKE + scoring TF-IDF
  // ============================================================
  try {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return Response.json({ results: [], total: 0, query, searchType: "text_tfidf", semanticSearchStatus: "not_configured" });
    }

    // Usa LIKE com o primeiro token para reduzir o conjunto antes do scoring
    const primaryToken = queryTokens[0];
    const catBinds: unknown[] = [`%${primaryToken}%`, `%${primaryToken}%`];
    if (category) catBinds.push(category);
    catBinds.push(...ownershipBinds);

    const likeRows = await env.DB
      .prepare(
        `SELECT n.id, n.title, n.content, n.category, n.source, n.tags, n.created_at
         FROM memory_notes n
         WHERE (n.content LIKE ? OR n.title LIKE ?)
           AND n.is_demo = 1
           ${category ? "AND n.category = ?" : ""}
           ${ownershipClause}
         LIMIT 100`
      )
      .bind(...catBinds)
      .all();

    const notes = (likeRows.results ?? []) as MemoryNote[];
    const scored = notes
      .map((n) => ({ ...n, score: scoreNote(query, n) }))
      .filter((n) => n.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return Response.json({
      results: scored,
      total: scored.length,
      query,
      category: category ?? null,
      searchType: "text_tfidf",
      semanticSearchStatus: "not_configured",
      searchStatusNote: "Busca semântica não configurada. Usando busca textual com scoring TF-IDF. Para habilitar busca semântica, configure Cloudflare Vectorize e Workers AI.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[memory/search] Erro na busca:", err);
    return Response.json(
      { results: [], total: 0, query, searchType: "text_tfidf", semanticSearchStatus: "error", error: "Erro na busca. Tente novamente." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
};
