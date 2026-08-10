import type { Express } from "express";
import { z } from "zod";
import {
  AGENDA_CLOUD_WORKSPACE_ID,
  agendaCloudWorkspaceSchema,
  agendaCloudWriteSchema,
  emptyAgendaCloudWorkspace,
  type AgendaCloudSnapshot,
  type AgendaCloudWorkspace,
} from "@shared/agenda-cloud";
import { sqlite } from "../storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";

interface WorkspaceRow {
  id: string;
  payload_encrypted: string;
  revision: number;
  updated_by_user_id: string | null;
  updated_at: string;
}

interface AuditRow {
  id: string;
  user_id: string | null;
  metadata: string | null;
  created_at: string;
}

const requireAgendaAccess = requireRole("admin", "professional", "operator");
const requireAgendaAuditAccess = requireRole("admin", "professional");

function ensureAgendaSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agenda_workspaces (
      id TEXT PRIMARY KEY,
      payload_encrypted TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0,
      updated_by_user_id TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS agenda_workspaces_updated_at_idx
      ON agenda_workspaces(updated_at DESC);
  `);
}

function decodeWorkspace(row: WorkspaceRow | undefined): AgendaCloudWorkspace {
  if (!row) return emptyAgendaCloudWorkspace();
  const raw = decrypt(row.payload_encrypted);
  if (!raw) throw new Error("agenda payload unavailable");
  const parsed = agendaCloudWorkspaceSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error("agenda payload invalid");
  return parsed.data;
}

function getWorkspaceRow(): WorkspaceRow | undefined {
  return sqlite
    .prepare(
      `SELECT id, payload_encrypted, revision, updated_by_user_id, updated_at
         FROM agenda_workspaces
        WHERE id = ?
        LIMIT 1`,
    )
    .get(AGENDA_CLOUD_WORKSPACE_ID) as WorkspaceRow | undefined;
}

function snapshotFromRow(row: WorkspaceRow | undefined): AgendaCloudSnapshot {
  return {
    workspace: decodeWorkspace(row),
    revision: row?.revision ?? 0,
    mode: "remote-live",
    updatedAt: row?.updated_at ?? null,
    updatedByUserId: row?.updated_by_user_id ?? null,
  };
}

function diffCounts(previous: AgendaCloudWorkspace, next: AgendaCloudWorkspace) {
  const summarize = <T extends { id: string }>(before: T[], after: T[]) => {
    const beforeMap = new Map(before.map((item) => [item.id, JSON.stringify(item)]));
    const afterMap = new Map(after.map((item) => [item.id, JSON.stringify(item)]));
    let created = 0;
    let updated = 0;
    let removed = 0;
    for (const [id, value] of afterMap) {
      if (!beforeMap.has(id)) created += 1;
      else if (beforeMap.get(id) !== value) updated += 1;
    }
    for (const id of beforeMap.keys()) {
      if (!afterMap.has(id)) removed += 1;
    }
    return { created, updated, removed };
  };

  return {
    appointments: summarize(previous.appointments, next.appointments),
    blocks: summarize(previous.blocks, next.blocks),
    waitlist: summarize(previous.waitlist, next.waitlist),
  };
}

function auditSummary(metadata: Record<string, unknown>): string {
  const counts = metadata.counts as Record<string, { created?: number; updated?: number; removed?: number }> | undefined;
  if (!counts) return "Agenda atualizada";
  const parts: string[] = [];
  for (const [name, value] of Object.entries(counts)) {
    const total = (value.created ?? 0) + (value.updated ?? 0) + (value.removed ?? 0);
    if (total > 0) parts.push(`${name}: ${total} alteração(ões)`);
  }
  return parts.length ? parts.join(" · ") : "Agenda sincronizada sem alterações de conteúdo";
}

export function registerAgendaRoutes(app: Express): void {
  ensureAgendaSchema();

  app.get("/api/agenda", requireAuth, requireAgendaAccess, async (req, res) => {
    try {
      const row = getWorkspaceRow();
      await logAudit({
        eventType: "result.read",
        context: getAuditContextFromRequest(req),
        targetType: "agenda_workspace",
        targetId: AGENDA_CLOUD_WORKSPACE_ID,
        metadata: { revision: row?.revision ?? 0 },
      });
      res.setHeader("Cache-Control", "private, no-store");
      return res.json(snapshotFromRow(row));
    } catch (error) {
      console.error("[agenda.GET]", error);
      return res.status(500).json({
        error: "Não foi possível carregar a agenda cifrada.",
        code: "AGENDA_STORAGE_ERROR",
      });
    }
  });

  app.put(
    "/api/agenda",
    requireAuth,
    requireAgendaAccess,
    writeRateLimit,
    async (req, res) => {
      try {
        const input = agendaCloudWriteSchema.parse(req.body);
        const transaction = sqlite.transaction(() => {
          const previousRow = getWorkspaceRow();
          const previousRevision = previousRow?.revision ?? 0;
          if (input.expectedRevision !== previousRevision) {
            return {
              conflict: true as const,
              snapshot: snapshotFromRow(previousRow),
            };
          }

          const previousWorkspace = decodeWorkspace(previousRow);
          const nextRevision = previousRevision + 1;
          const updatedAt = new Date().toISOString();
          const payloadEncrypted = encrypt(JSON.stringify(input.workspace));
          if (previousRow) {
            sqlite
              .prepare(
                `UPDATE agenda_workspaces
                    SET payload_encrypted = ?, revision = ?, updated_by_user_id = ?, updated_at = ?
                  WHERE id = ? AND revision = ?`,
              )
              .run(
                payloadEncrypted,
                nextRevision,
                req.user!.id,
                updatedAt,
                AGENDA_CLOUD_WORKSPACE_ID,
                previousRevision,
              );
          } else {
            sqlite
              .prepare(
                `INSERT INTO agenda_workspaces
                  (id, payload_encrypted, revision, updated_by_user_id, updated_at)
                 VALUES (?, ?, ?, ?, ?)`,
              )
              .run(
                AGENDA_CLOUD_WORKSPACE_ID,
                payloadEncrypted,
                nextRevision,
                req.user!.id,
                updatedAt,
              );
          }

          return {
            conflict: false as const,
            previousRevision,
            nextRevision,
            updatedAt,
            counts: diffCounts(previousWorkspace, input.workspace),
          };
        });

        const result = transaction();
        if (result.conflict) {
          return res.status(409).json({
            error: "A agenda foi alterada em outro dispositivo. Recarregue antes de salvar.",
            code: "REVISION_CONFLICT",
            latest: result.snapshot,
          });
        }

        await logAudit({
          eventType: "result.update",
          context: getAuditContextFromRequest(req),
          targetType: "agenda_workspace",
          targetId: AGENDA_CLOUD_WORKSPACE_ID,
          metadata: {
            operation: "agenda.snapshot.update",
            previousRevision: result.previousRevision,
            revision: result.nextRevision,
            counts: result.counts,
          },
        });

        const snapshot: AgendaCloudSnapshot = {
          workspace: input.workspace,
          revision: result.nextRevision,
          mode: "remote-live",
          updatedAt: result.updatedAt,
          updatedByUserId: req.user!.id,
        };
        res.setHeader("Cache-Control", "private, no-store");
        return res.json(snapshot);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: "Agenda inválida.",
            code: "VALIDATION_ERROR",
            details: error.errors,
          });
        }
        console.error("[agenda.PUT]", error);
        return res.status(500).json({
          error: "Não foi possível sincronizar a agenda.",
          code: "AGENDA_STORAGE_ERROR",
        });
      }
    },
  );

  app.get(
    "/api/agenda/audit",
    requireAuth,
    requireAgendaAuditAccess,
    async (req, res) => {
      const rawLimit = Number(req.query.limit ?? 30);
      const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.round(rawLimit))) : 30;
      const rows = sqlite
        .prepare(
          `SELECT id, user_id, metadata, created_at
             FROM audit_logs
            WHERE target_type = 'agenda_workspace'
              AND target_id = ?
              AND event_type = 'result.update'
            ORDER BY created_at DESC
            LIMIT ?`,
        )
        .all(AGENDA_CLOUD_WORKSPACE_ID, limit) as AuditRow[];

      const data = rows.map((row) => {
        let metadata: Record<string, unknown> = {};
        try {
          metadata = row.metadata ? JSON.parse(row.metadata) : {};
        } catch {
          metadata = {};
        }
        return {
          id: row.id,
          userId: row.user_id,
          action: String(metadata.operation ?? "agenda.snapshot.update"),
          summary: auditSummary(metadata),
          createdAt: row.created_at,
        };
      });
      res.setHeader("Cache-Control", "private, no-store");
      return res.json({ data, total: data.length, mode: "remote-live" });
    },
  );
}
