import type { Express } from "express";
import { z } from "zod";
import { conectaEventInputSchema, type ConectaEvent } from "@shared/conecta";
import { sqlite, db } from "../storage.js";
import { patients } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { canAccessPatient, type AuthzUser } from "../lib/ownership.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";
import { oneParam } from "../lib/http.js";

interface StoredRow {
  id: string;
  patient_id: string;
  author_user_id: string | null;
  category: string;
  occurred_at: string;
  context: string | null;
  value: number | null;
  duration_minutes: number | null;
  payload_encrypted: string | null;
  created_at: string;
}

function ensureConectaSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conecta_events (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      author_user_id TEXT,
      category TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      context TEXT,
      value INTEGER,
      duration_minutes INTEGER,
      payload_encrypted TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS conecta_events_patient_time_idx
      ON conecta_events(patient_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS conecta_events_category_idx
      ON conecta_events(category);
  `);
}

function payloadFromRow(row: StoredRow): Pick<ConectaEvent, "note" | "detail"> {
  if (!row.payload_encrypted) return {};
  try {
    const raw = decrypt(row.payload_encrypted);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { note?: string; detail?: ConectaEvent["detail"] };
    return {
      ...(typeof parsed.note === "string" ? { note: parsed.note } : {}),
      ...(parsed.detail && typeof parsed.detail === "object" ? { detail: parsed.detail } : {}),
    };
  } catch {
    // Falha de integridade deve impedir a exposição de conteúdo potencialmente corrompido.
    return {};
  }
}

function present(row: StoredRow): ConectaEvent {
  return {
    id: row.id,
    patientId: row.patient_id,
    authorUserId: row.author_user_id,
    category: row.category as ConectaEvent["category"],
    occurredAt: row.occurred_at,
    ...(row.context ? { context: row.context as ConectaEvent["context"] } : {}),
    ...(typeof row.value === "number" ? { value: row.value } : {}),
    ...(typeof row.duration_minutes === "number" ? { durationMinutes: row.duration_minutes } : {}),
    ...payloadFromRow(row),
    createdAt: row.created_at,
    storageMode: "remote",
  };
}

function patientFor(user: AuthzUser, patientId: string) {
  const patient = db.select().from(patients).where(eq(patients.id, patientId)).get();
  if (!patient) return { status: 404 as const, patient: null };
  if (!canAccessPatient(user, patient)) return { status: 403 as const, patient: null };
  return { status: 200 as const, patient };
}

export function registerConectaRoutes(app: Express): void {
  ensureConectaSchema();

  app.get("/api/conecta/events", requireAuth, async (req, res) => {
    const patientId = typeof req.query.patient_id === "string" ? req.query.patient_id.trim() : "";
    if (!patientId || patientId.length > 128) {
      return res.status(400).json({ error: "patient_id inválido", code: "VALIDATION_ERROR" });
    }
    const daysRaw = typeof req.query.days === "string" ? Number(req.query.days) : 90;
    const days = Number.isFinite(daysRaw) ? Math.min(365, Math.max(1, Math.round(daysRaw))) : 90;
    const access = patientFor(req.user!, patientId);
    if (!access.patient) {
      return res.status(access.status).json({
        error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
        code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
      });
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = sqlite
      .prepare(
        `SELECT id, patient_id, author_user_id, category, occurred_at, context,
                value, duration_minutes, payload_encrypted, created_at
           FROM conecta_events
          WHERE patient_id = ? AND occurred_at >= ?
          ORDER BY occurred_at DESC
          LIMIT 1000`,
      )
      .all(patientId, cutoff) as StoredRow[];

    await logAudit({
      eventType: "result.read",
      context: getAuditContextFromRequest(req),
      targetType: "conecta_timeline",
      targetId: patientId,
      metadata: { count: rows.length, days },
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ data: rows.map(present), total: rows.length, mode: "remote" });
  });

  app.post(
    "/api/conecta/events",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
      try {
        const input = conectaEventInputSchema.parse(req.body);
        const access = patientFor(req.user!, input.patientId);
        if (!access.patient) {
          return res.status(access.status).json({
            error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
            code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
          });
        }

        const id = `conecta-${crypto.randomUUID()}`;
        const createdAt = new Date().toISOString();
        const sensitivePayload = input.note || input.detail
          ? encrypt(JSON.stringify({ note: input.note, detail: input.detail }))
          : null;

        sqlite
          .prepare(
            `INSERT INTO conecta_events
              (id, patient_id, author_user_id, category, occurred_at, context,
               value, duration_minutes, payload_encrypted, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            input.patientId,
            req.user!.id,
            input.category,
            input.occurredAt,
            input.context ?? null,
            input.value ?? null,
            input.durationMinutes ?? null,
            sensitivePayload,
            createdAt,
          );

        const created: ConectaEvent = {
          id,
          ...input,
          authorUserId: req.user!.id,
          createdAt,
          storageMode: "remote",
        };
        await logAudit({
          eventType: "result.create",
          context: getAuditContextFromRequest(req),
          targetType: "conecta_event",
          targetId: id,
          metadata: { patientId: input.patientId, category: input.category },
        });
        return res.status(201).json(created);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Registro inválido", details: error.errors });
        }
        console.error("[conecta.create]", error);
        return res.status(500).json({ error: "Não foi possível salvar o registro." });
      }
    },
  );

  app.delete(
    "/api/conecta/events/:id",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
      const id = oneParam(req.params.id);
      const row = sqlite
        .prepare("SELECT id, patient_id FROM conecta_events WHERE id = ? LIMIT 1")
        .get(id) as Pick<StoredRow, "id" | "patient_id"> | undefined;
      if (!row) return res.status(404).json({ error: "Registro não encontrado", code: "NOT_FOUND" });
      const access = patientFor(req.user!, row.patient_id);
      if (!access.patient) {
        return res.status(access.status).json({
          error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
          code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
        });
      }
      sqlite.prepare("DELETE FROM conecta_events WHERE id = ?").run(id);
      await logAudit({
        eventType: "result.delete",
        context: getAuditContextFromRequest(req),
        targetType: "conecta_event",
        targetId: id,
        metadata: { patientId: row.patient_id },
      });
      return res.json({ ok: true });
    },
  );
}
