/**
 * GET /api/memory/search?q=termo
 *
 * Em modo estrito, conteúdo clínico nunca é consultado por LIKE/FTS em claro:
 * o D1 seleciona candidatos por blind index HMAC e o ranking TF-IDF ocorre
 * somente após autorização e decriptação do envelope AES-GCM.
 */

import { getContextUser, isAdmin } from "../auth/_authorization";
import {
  blindTokenGroupsForQuery,
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";

interface Env extends ClinicalCryptoEnv {
  DB?: D1Database;
  AI?: Ai;
  VECTORIZE?: Vectorize;
}

interface MemoryNoteRow {
  id: string;
  title: string | null;
  content: string;
  category: string | null;
  source: string | null;
  patient_id: string | null;
  tags: string | null;
  secure_payload_encrypted: string | null;
  created_at: string;
}

interface SecureMemoryPayload {
  title: string | null;
  content: string;
  source: string | null;
  tags: string | null;
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

const MEMORY_SEARCH_LIMITS = { query: 300, category: 80, results: 20, candidates: 160 } as const;

function validationError(message: string): Response {
  return Response.json({ error: message, code: "VALIDATION_ERROR" }, { status: 400, headers: { "Cache-Control": "no-store" } });
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

const DEMO_NOTES: MemoryNote[] = [
  { id: "mem-demo-001", title: "M-CHAT-R/F — Pontos de corte", content: "M-CHAT-R/F: conteúdo demonstrativo para teste da busca. DADO FICTÍCIO.", category: "escala", source: "manual_mchat", tags: '["mchat","tea","triagem","autismo"]', created_at: new Date("2025-01-01").toISOString() },
  { id: "mem-demo-002", title: "SNAP-IV — Interpretação clínica", content: "SNAP-IV: conteúdo demonstrativo para teste da busca. DADO FICTÍCIO.", category: "escala", source: "manual_snap", tags: '["snap","tdah","hiperatividade","atencao"]', created_at: new Date("2025-01-01").toISOString() },
];

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length > 2);
}
function tf(term: string, tokens: string[]): number { return tokens.filter((token) => token === term).length / (tokens.length || 1); }
function normalizedText(value: string): string { return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function phraseBoost(query: string, text: string): number { return normalizedText(text).includes(normalizedText(query)) ? 0.5 : 0; }
function scoreNote(query: string, note: MemoryNote): number {
  const queryTokens = tokenize(query); if (!queryTokens.length) return 0;
  let tagText = "";
  if (note.tags) {
    try { const parsed: unknown = JSON.parse(note.tags); if (Array.isArray(parsed)) tagText = parsed.filter((tag): tag is string => typeof tag === "string").join(" "); } catch { /* legado malformado não derruba a busca */ }
  }
  const fields = [
    { text: note.title ?? "", weight: 3 }, { text: note.content, weight: 1 },
    { text: note.category ?? "", weight: 2 }, { text: tagText, weight: 1.5 },
  ];
  let total = 0;
  for (const { text, weight } of fields) {
    const tokens = tokenize(text);
    for (const queryToken of queryTokens) total += tf(queryToken, tokens) * weight;
    total += phraseBoost(query, text) * weight;
  }
  const max = queryTokens.length * 7.5 + 3.75;
  return Math.min(1, total / max);
}

async function decryptNote(env: Env, row: MemoryNoteRow): Promise<MemoryNote> {
  const legacy = row.content && row.content !== "__NEUROPED_ENCRYPTED_C1__"
    ? JSON.stringify({ title: row.title, content: row.content, source: row.source, tags: row.tags })
    : null;
  const payload = await decryptClinicalPayload<SecureMemoryPayload>(env, "memory_notes", row.id, row.secure_payload_encrypted, legacy);
  if (!payload?.content) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return { id: row.id, title: payload.title ?? null, content: payload.content, category: row.category, source: payload.source ?? null, tags: payload.tags ?? null, created_at: row.created_at };
}

function blindCandidateClause(groups: string[][]): { sql: string; binds: string[] } {
  const binds: string[] = [];
  const clauses = groups.map((group) => {
    binds.push(...group);
    return `EXISTS (
      SELECT 1 FROM clinical_search_tokens cst
       WHERE cst.resource_type = 'memory_note'
         AND cst.resource_id = n.id
         AND cst.token_hash IN (${group.map(() => "?").join(",")})
    )`;
  });
  return { sql: clauses.length ? `AND ${clauses.join(" AND ")}` : "", binds };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context; const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limit = parseResultLimit(url.searchParams.get("limit"));
  const category = url.searchParams.get("category")?.trim();
  const minScore = parseMinimumScore(url.searchParams.get("min_score"));
  if (!query) return Response.json({ results: [], total: 0, searchType: "none", error: "Parâmetro 'q' é obrigatório." }, { status: 400 });
  if (query.length > MEMORY_SEARCH_LIMITS.query) return validationError(`'q' deve ter no máximo ${MEMORY_SEARCH_LIMITS.query} caracteres.`);
  if (category && category.length > MEMORY_SEARCH_LIMITS.category) return validationError(`'category' deve ter no máximo ${MEMORY_SEARCH_LIMITS.category} caracteres.`);
  if (limit === null) return validationError("'limit' deve ser um número inteiro válido.");
  if (minScore === null) return validationError("'min_score' deve ser um número entre 0 e 1.");

  if (!env.DB) {
    const scored = DEMO_NOTES.filter((note) => !category || note.category === category).map((note) => ({ ...note, score: scoreNote(query, note) })).filter((note) => note.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit);
    return Response.json({ results: scored, total: scored.length, query, category: category ?? null, searchType: "demo_tfidf", semanticSearchStatus: "not_configured" }, { headers: { "Cache-Control": "no-store" } });
  }

  const user = getContextUser(context);
  if (!user) return Response.json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const strict = env.CLINICAL_ENCRYPTION_STRICT === "true";
    const groups = await blindTokenGroupsForQuery(env, "memory_note", query);
    if (strict && !groups.length) return Response.json({ results: [], total: 0, query, searchType: "blind_index_tfidf" }, { headers: { "Cache-Control": "no-store" } });
    const blind = strict ? blindCandidateClause(groups) : { sql: "", binds: [] as string[] };
    const ownership = isAdmin(user)
      ? ""
      : `AND n.patient_id IN (SELECT p.id FROM patients_demo p WHERE p.owner_user_id = ? AND p.is_demo = 1)`;
    const binds: unknown[] = [];
    if (category) binds.push(category);
    if (!isAdmin(user)) binds.push(user.id);
    binds.push(...blind.binds, MEMORY_SEARCH_LIMITS.candidates);

    const rows = await env.DB.prepare(
      `SELECT n.id, n.title, n.content, n.category, n.source, n.patient_id, n.tags,
              n.secure_payload_encrypted, n.created_at
         FROM memory_notes n
        WHERE n.is_demo = 1
          ${category ? "AND n.category = ?" : ""}
          ${ownership}
          ${blind.sql}
        ORDER BY n.created_at DESC
        LIMIT ?`,
    ).bind(...binds).all<MemoryNoteRow>();

    const notes = await Promise.all((rows.results ?? []).map((row) => decryptNote(env, row)));
    const scored = notes.map((note) => ({ ...note, score: scoreNote(query, note) })).filter((note) => note.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit);
    return Response.json({
      results: scored, total: scored.length, query, category: category ?? null,
      searchType: strict ? "blind_index_tfidf" : "dual_read_tfidf",
      semanticSearchStatus: env.VECTORIZE && env.AI ? "configured_pending_implementation" : "not_configured",
      searchStatusNote: strict ? "Candidatos por blind index; ranking somente após decriptação autorizada." : "Janela de migração dual-read; plaintext será recusado quando strict=true.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const cryptoResponse = clinicalCryptoErrorResponse(error); if (cryptoResponse) return cryptoResponse;
    console.error("[memory/search] erro:", error);
    return Response.json({ error: "Erro na busca de memória.", code: "SEARCH_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
};
