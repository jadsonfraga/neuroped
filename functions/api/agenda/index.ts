import {
  AGENDA_CLOUD_WORKSPACE_ID,
  agendaCloudWorkspaceSchema,
  agendaCloudWriteSchema,
  emptyAgendaCloudWorkspace,
  isDemoSafeAgendaWorkspace,
  type AgendaCloudSnapshot,
  type AgendaCloudWorkspace,
} from "../../../shared/agenda-cloud";
import {
  canAccessOperationalAgenda,
  canWriteOperationalAgenda,
  getContextUser,
} from "../auth/_authorization";
import { ensureAgendaDemoSchema } from "./_schema";

interface Env {
  DB?: D1Database;
}

interface WorkspaceRow {
  id: string;
  payload_json: string;
  revision: number;
  updated_by_user_id: string | null;
  updated_at: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function error(message: string, code: string, status: number, extra?: Record<string, unknown>): Response {
  return json({ error: message, code, ...extra }, status);
}

function present(row: WorkspaceRow | null): AgendaCloudSnapshot | null {
  if (!row) {
    return {
      workspace: emptyAgendaCloudWorkspace(),
      revision: 0,
      mode: "demo-cloud",
      updatedAt: null,
      updatedByUserId: null,
    };
  }
  try {
    const parsed = agendaCloudWorkspaceSchema.safeParse(JSON.parse(row.payload_json));
    if (!parsed.success) return null;
    return {
      workspace: parsed.data,
      revision: row.revision,
      mode: "demo-cloud",
      updatedAt: row.updated_at,
      updatedByUserId: row.updated_by_user_id,
    };
  } catch {
    return null;
  }
}

function summarize<T extends { id: string }>(before: T[], after: T[]): number {
  const beforeMap = new Map(before.map((item) => [item.id, JSON.stringify(item)]));
  const afterMap = new Map(after.map((item) => [item.id, JSON.stringify(item)]));
  let changes = 0;
  for (const [id, value] of afterMap) {
    if (!beforeMap.has(id) || beforeMap.get(id) !== value) changes += 1;
  }
  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) changes += 1;
  }
  return changes;
}

function changeSummary(previous: AgendaCloudWorkspace, next: AgendaCloudWorkspace): string {
  const appointments = summarize(previous.appointments, next.appointments);
  const blocks = summarize(previous.blocks, next.blocks);
  const waitlist = summarize(previous.waitlist, next.waitlist);
  return `agendamentos:${appointments}; bloqueios:${blocks}; espera:${waitlist}`;
}

async function getRow(db: D1Database): Promise<WorkspaceRow | null> {
  return db
    .prepare(
      `SELECT id, payload_json, revision, updated_by_user_id, updated_at
         FROM agenda_workspace_demo
        WHERE id = ? AND is_demo = 1
        LIMIT 1`,
    )
    .bind(AGENDA_CLOUD_WORKSPACE_ID)
    .first<WorkspaceRow>();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  if (!env.DB) {
    return error("Agenda remota indisponível.", "STORAGE_UNAVAILABLE", 503);
  }
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canAccessOperationalAgenda(user)) {
    return error("Perfil sem acesso à agenda operacional.", "FORBIDDEN", 403);
  }

  try {
    await ensureAgendaDemoSchema(env.DB);
    const snapshot = present(await getRow(env.DB));
    if (!snapshot) {
      return error("Agenda demo contém payload inválido.", "AGENDA_STORAGE_ERROR", 500);
    }
    return json(snapshot);
  } catch (cause) {
    console.error("[agenda.GET]", cause);
    return error("Não foi possível carregar a agenda demo.", "DB_ERROR", 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) {
    return error("Agenda remota indisponível.", "STORAGE_UNAVAILABLE", 503);
  }
  const user = getContextUser(context);
  if (!user) return error("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteOperationalAgenda(user)) {
    return error("Perfil sem permissão para alterar a agenda.", "FORBIDDEN", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const parsed = agendaCloudWriteSchema.safeParse(body);
  if (!parsed.success) {
    return error("Agenda inválida.", "VALIDATION_ERROR", 400, {
      details: parsed.error.issues,
    });
  }
  if (!isDemoSafeAgendaWorkspace(parsed.data.workspace)) {
    return error(
      "O backend Cloudflare desta instalação aceita somente dados fictícios marcados como DEMO. Use o backend privado LIVE para dados reais.",
      "DEMO_DATA_ONLY",
      422,
    );
  }

  try {
    await ensureAgendaDemoSchema(env.DB);
    const previousRow = await getRow(env.DB);
    const previousSnapshot = present(previousRow);
    if (!previousSnapshot) {
      return error("Agenda demo contém payload inválido.", "AGENDA_STORAGE_ERROR", 500);
    }
    if (parsed.data.expectedRevision !== previousSnapshot.revision) {
      return error(
        "A agenda foi alterada em outro dispositivo. Recarregue antes de salvar.",
        "REVISION_CONFLICT",
        409,
        { latest: previousSnapshot },
      );
    }

    const nextRevision = previousSnapshot.revision + 1;
    const updatedAt = new Date().toISOString();
    const payloadJson = JSON.stringify(parsed.data.workspace);

    if (previousRow) {
      const result = await env.DB
        .prepare(
          `UPDATE agenda_workspace_demo
              SET payload_json = ?, revision = ?, updated_by_user_id = ?, updated_at = ?
            WHERE id = ? AND is_demo = 1 AND revision = ?`,
        )
        .bind(
          payloadJson,
          nextRevision,
          user.id,
          updatedAt,
          AGENDA_CLOUD_WORKSPACE_ID,
          previousSnapshot.revision,
        )
        .run();
      if ((result.meta?.changes ?? 0) !== 1) {
        const latest = present(await getRow(env.DB));
        return error("Conflito de revisão ao salvar a agenda.", "REVISION_CONFLICT", 409, {
          ...(latest ? { latest } : {}),
        });
      }
    } else {
      try {
        await env.DB
          .prepare(
            `INSERT INTO agenda_workspace_demo
              (id, payload_json, revision, updated_by_user_id, is_demo, updated_at)
             VALUES (?, ?, ?, ?, 1, ?)`,
          )
          .bind(
            AGENDA_CLOUD_WORKSPACE_ID,
            payloadJson,
            nextRevision,
            user.id,
            updatedAt,
          )
          .run();
      } catch {
        const latest = present(await getRow(env.DB));
        return error("Conflito de revisão ao criar a agenda.", "REVISION_CONFLICT", 409, {
          ...(latest ? { latest } : {}),
        });
      }
    }

    await env.DB
      .prepare(
        `INSERT INTO agenda_audit_demo
          (id, workspace_id, user_id, action, summary, revision, is_demo, created_at)
         VALUES (?, ?, ?, 'agenda.snapshot.update', ?, ?, 1, ?)`,
      )
      .bind(
        `agenda-audit-${crypto.randomUUID()}`,
        AGENDA_CLOUD_WORKSPACE_ID,
        user.id,
        changeSummary(previousSnapshot.workspace, parsed.data.workspace),
        nextRevision,
        updatedAt,
      )
      .run();

    const snapshot: AgendaCloudSnapshot = {
      workspace: parsed.data.workspace,
      revision: nextRevision,
      mode: "demo-cloud",
      updatedAt,
      updatedByUserId: user.id,
    };
    return json(snapshot);
  } catch (cause) {
    console.error("[agenda.PUT]", cause);
    return error("Não foi possível sincronizar a agenda demo.", "DB_ERROR", 500);
  }
};
