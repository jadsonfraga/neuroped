/**
 * GET /api/patients/:id/results — lista resultados somente quando o usuário
 * autenticado pode acessar o paciente. Com parâmetros de paginação publica o
 * envelope canônico; sem parâmetros preserva o array direto para clientes antigos.
 */

import {
  authorizationError,
  getContextUser,
  getPatientAccess,
} from "../../auth/_authorization";
import { isValidPatientId, parsePositiveInteger } from "../_contract";

interface Env {
  DB?: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function errorResponse(
  message: string,
  code: string,
  status: number,
): Response {
  return json({ error: message, code }, status);
}

function parseDetails(details: unknown): Record<string, unknown> | null {
  if (typeof details !== "string") return null;
  try {
    const parsed = JSON.parse(details);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseResponses(details: unknown): unknown[] {
  const parsed = parseDetails(details);
  const responses = parsed?.responses ?? parsed?.answers;
  return Array.isArray(responses) ? responses : [];
}

function isFamilyLinkResult(details: unknown): boolean {
  return parseDetails(details)?.source === "family-link";
}

const MAX_RESULTS_PAGE_SIZE = 200;
const MAX_RESULTS_OFFSET = 2_000_000;

function parseOffset(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return Math.min(parsed, MAX_RESULTS_OFFSET);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const rawId = params.id;
  const patientId = String(
    Array.isArray(rawId) ? rawId[0] : (rawId ?? ""),
  ).trim();

  if (!patientId) {
    return errorResponse("ID do paciente não fornecido.", "MISSING_ID", 400);
  }
  if (!isValidPatientId(patientId)) {
    return errorResponse("ID do paciente inválido.", "INVALID_ID", 400);
  }

  const url = new URL(request.url);
  const paginationRequested = ["page", "limit", "offset"].some((key) =>
    url.searchParams.has(key),
  );
  const limit = parsePositiveInteger(
    url.searchParams.get("limit"),
    MAX_RESULTS_PAGE_SIZE,
    MAX_RESULTS_PAGE_SIZE,
  );
  const requestedPage = parsePositiveInteger(
    url.searchParams.get("page"),
    1,
    10_000,
  );
  const explicitOffset = parseOffset(url.searchParams.get("offset"));
  const offset = explicitOffset ?? (requestedPage - 1) * limit;
  const page = Math.floor(offset / limit) + 1;

  if (!env.DB) {
    return paginationRequested
      ? json({ data: [], total: 0, page, limit, hasMore: false }, 200)
      : json([], 200);
  }

  const user = getContextUser(context);
  if (!user) {
    return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  }

  try {
    const access = await getPatientAccess(env.DB, patientId, user);
    if (!access.exists) {
      return errorResponse("Paciente não encontrado.", "NOT_FOUND", 404);
    }
    if (!access.allowed) {
      return authorizationError(
        "Você não tem acesso a este paciente.",
        "FORBIDDEN",
        403,
      );
    }

    let total: number | null = null;
    if (paginationRequested) {
      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) AS total
           FROM scale_results_demo
          WHERE patient_id = ? AND is_demo = 1`,
      )
        .bind(patientId)
        .first<{ total: number }>();
      total = Number(countResult?.total ?? 0);
      if (!Number.isSafeInteger(total) || total < 0) {
        throw new Error("Contagem de resultados inválida.");
      }
    }

    const rows = await env.DB.prepare(
      `SELECT id, patient_id, scale_id, scale_name, details, applied_at, is_demo
           FROM scale_results_demo
          WHERE patient_id = ? AND is_demo = 1
          ORDER BY applied_at DESC, id DESC
          LIMIT ? OFFSET ?`,
    )
      .bind(
        patientId,
        paginationRequested ? limit : MAX_RESULTS_PAGE_SIZE,
        paginationRequested ? offset : 0,
      )
      .all();
    const data = (rows.results ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      patientId: row.patient_id,
      scaleId: row.scale_id,
      scaleName: row.scale_name,
      responses: parseResponses(row.details),
      origin: isFamilyLinkResult(row.details) ? "family-link" : undefined,
      createdAt: row.applied_at,
      isDemo: row.is_demo === true || row.is_demo === 1 || row.is_demo === "1",
    }));
    if (!paginationRequested) return json(data, 200);
    if (total === null) throw new Error("Contagem de resultados ausente.");
    return json(
      {
        data,
        total,
        page,
        limit,
        hasMore: offset + data.length < total,
      },
      200,
    );
  } catch (error) {
    console.error("[patients/:id/results.GET] DB error:", error);
    return errorResponse(
      "Erro ao buscar resultados do paciente.",
      "DB_ERROR",
      500,
    );
  }
};
