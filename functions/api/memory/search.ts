/**
 * GET /api/memory/search?q=termo
 * Cloudflare Pages Function — Busca em notas de memória clínica
 *
 * Estratégias de busca (em ordem de prioridade):
 *  1. FTS5 (Full-Text Search nativo do SQLite/D1) — mais rápida quando disponível
 *  2. Busca textual com scoring TF-IDF simplificado — fallback confiável
 *  3. Modo demo sem banco — retorna notas fictícias filtradas
 *
 * Busca semântica real (Vectorize + Workers AI) ainda não implementada.
 * Quando disponível, substituir a estratégia 2 por embeddings.
 *
 * LGPD: este endpoint NÃO retorna dados de pacientes identificáveis.
 * Apenas notas clínicas categorizadas.
 */

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

// Notas demo para fallback sem banco
const DEMO_NOTES: MemoryNote[] = [
  {
    id: "mem-demo-001",
    title: "M-CHAT-R/F — Pontos de corte",
    content: "M-CHAT-R/F: Score 0-2 = baixo risco; 3-7 = risco moderado (realizar entrevista follow-up); 8-20 = risco elevado (encaminhamento imediato). Sensibilidade 91%, especificidade 95%.",
    category: "escala",
    source: "manual_mchat",
    tags: '["mchat","tea","triagem","autismo"]',
    created_at: new Date("2025-01-01").toISOString(),
  },
  {
    id: "mem-demo-002",
    title: "SNAP-IV — Interpretação clínica",
    content: "SNAP-IV: Limiar clínico = média dos itens ≥ 2.0 por subescala. Desatenção: 9 itens. Hiperatividade/Impulsividade: 9 itens. Usar percentis por idade e sexo.",
    category: "escala",
    source: "manual_snap",
    tags: '["snap","tdah","hiperatividade","atencao"]',
    created_at: new Date("2025-01-01").toISOString(),
  },
  {
    id: "mem-demo-003",
    title: "Metilfenidato — Posologia pediátrica",
    content: "Metilfenidato: dose inicial 5mg 1-2x/dia. Titulação semanal de 5mg. Dose máxima: 60mg/dia. Avaliar: apetite, sono, crescimento, FC e PA a cada consulta. DADO FICTÍCIO.",
    category: "farmacologia",
    source: "prontuario_demo",
    tags: '["metilfenidato","tdah","posologia","pediatria"]',
    created_at: new Date("2025-02-01").toISOString(),
  },
];

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

  const fieldWeights = [
    { text: note.title ?? "", weight: 3.0 },
    { text: note.content, weight: 1.0 },
    { text: note.category ?? "", weight: 2.0 },
    { text: note.tags ? JSON.parse(note.tags).join(" ") : "", weight: 1.5 },
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
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)));
  const category = url.searchParams.get("category")?.trim();
  const minScore = parseFloat(url.searchParams.get("min_score") ?? "0.05");

  if (!query) {
    return Response.json({
      results: [],
      total: 0,
      searchType: "none",
      semanticSearchStatus: "idle",
      error: "Parâmetro 'q' é obrigatório.",
    }, { status: 400 });
  }

  const hasVectorize = !!env.VECTORIZE;
  const hasAI = !!env.AI;

  // ============================================================
  // MODO DEMO (sem banco configurado)
  // ============================================================
  if (!env.DB) {
    const scored = DEMO_NOTES
      .filter((n) => !category || n.category === category)
      .map((n) => ({ ...n, score: scoreNote(query, n) }))
      .filter((n) => n.score > minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return Response.json({
      results: scored,
      total: scored.length,
      query,
      category: category ?? null,
      searchType: "text_tfidf",
      semanticSearchStatus: "not_configured",
      searchStatusNote: "Banco D1 não configurado. Busca textual (TF-IDF) em notas de demonstração.",
    }, { headers: { "Cache-Control": "no-store" } });
  }

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
    ftsBinds.push(limit);

    const ftsRows = await env.DB
      .prepare(
        `SELECT n.id, n.title, n.content, n.category, n.source, n.tags, n.created_at,
                bm25(memory_notes_fts) * -1 AS score
         FROM memory_notes_fts
         JOIN memory_notes n ON memory_notes_fts.rowid = n.rowid
         WHERE memory_notes_fts MATCH ?
           AND n.is_demo = 1 ${categoryClause}
         ORDER BY score DESC
         LIMIT ?`
      )
      .bind(...ftsBinds)
      .all();

    if (ftsRows.results && ftsRows.results.length > 0) {
      const maxFtsScore = (ftsRows.results[0] as any).score ?? 1;
      const results = (ftsRows.results as any[]).map((r) => ({
        ...r,
        score: maxFtsScore > 0 ? Math.min(1, r.score / maxFtsScore) : 0,
      }));

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

    const likeRows = await env.DB
      .prepare(
        `SELECT id, title, content, category, source, tags, created_at
         FROM memory_notes
         WHERE (content LIKE ? OR title LIKE ?)
           AND is_demo = 1
           ${category ? "AND category = ?" : ""}
         LIMIT 100`
      )
      .bind(...catBinds)
      .all();

    const notes = (likeRows.results ?? []) as MemoryNote[];
    const scored = notes
      .map((n) => ({ ...n, score: scoreNote(query, n) }))
      .filter((n) => n.score > minScore)
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
