import type { Express } from "express";
import {
  clinicalEventInputSchema,
  clinicalEventTypes,
  type ClinicalEvent,
  type ClinicalEventStatus,
  type ClinicalEventType,
  type ClinicalProvenanceKind,
  type ClinicalSource,
} from "@shared/clinical-core";
import { patients } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db, sqlite } from "../storage.js";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { canAccessPatient, type AuthzUser } from "../lib/ownership.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";

interface StoredClinicalEventRow {
  id: string;
  patient_id: string;
  author_user_id: string | null;
  event_type: ClinicalEventType;
  occurred_at: string;
  encounter_id: string | null;
  provenance_kind: ClinicalProvenanceKind;
  provenance_source: ClinicalSource;
  payload_encrypted: string;
  supersedes_event_id: string | null;
  status: ClinicalEventStatus;
  created_at: string;
}

interface SensitivePayload {
  data: ClinicalEvent["data"];
  note?: string;
  sourceLabel?: string;
  capturedAt?: string;
}

function ensureClinicalCoreSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS clinical_events (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      author_user_id TEXT,
      event_type TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      encounter_id TEXT,
      provenance_kind TEXT NOT NULL,
      provenance_source TEXT NOT NULL,
      payload_encrypted TEXT NOT NULL,
      supersedes_event_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(supersedes_event_id) REFERENCES clinical_events(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS clinical_events_patient_time_idx
      ON clinical_events(patient_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS clinical_events_type_idx
      ON clinical_events(patient_id, event_type, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS clinical_events_encounter_idx
      ON clinical_events(encounter_id);
    CREATE INDEX IF NOT EXISTS clinical_events_supersedes_idx
      ON clinical_events(supersedes_event_id);
  `);
}

function patientFor(user: AuthzUser, patientId: string) {
  const patient = db.select().from(patients).where(eq(patients.id, patientId)).get();
  if (!patient) return { status: 404 as const, patient: null };
  if (!canAccessPatient(user, patient)) return { status: 403 as const, patient: null };
  return { status: 200 as const, patient };
}

function decodeRow(row: StoredClinicalEventRow): ClinicalEvent | null {
  try {
    const raw = decrypt(row.payload_encrypted);
    if (!raw) return null;
    const sensitive = JSON.parse(raw) as SensitivePayload;
    const parsed = clinicalEventInputSchema.safeParse({
      patientId: row.patient_id,
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      ...(row.encounter_id ? { encounterId: row.encounter_id } : {}),
      provenance: {
        kind: row.provenance_kind,
        source: row.provenance_source,
        ...(sensitive.sourceLabel ? { sourceLabel: sensitive.sourceLabel } : {}),
        ...(sensitive.capturedAt ? { capturedAt: sensitive.capturedAt } : {}),
      },
      ...(sensitive.note ? { note: sensitive.note } : {}),
      ...(row.supersedes_event_id ? { supersedesEventId: row.supersedes_event_id } : {}),
      data: sensitive.data,
    });
    if (!parsed.success) return null;
    return {
      id: row.id,
      ...parsed.data,
      authorUserId: row.author_user_id,
      status: row.status,
      createdAt: row.created_at,
      storageMode: "remote",
    };
  } catch {
    return null;
  }
}

function parseEventTypes(raw: unknown): ClinicalEventType[] | null {
  if (raw == null || raw === "") return [];
  if (typeof raw !== "string") return null;
  const unique = [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
  if (unique.length > clinicalEventTypes.length) return null;
  if (unique.some((item) => !clinicalEventTypes.includes(item as ClinicalEventType))) return null;
  return unique as ClinicalEventType[];
}

export function registerClinicalCoreRoutes(app: Express): void {
  ensureClinicalCoreSchema();

  app.get("/api/clinical-core/events", requireAuth, async (req, res) => {
    const patientId = typeof req.query.patient_id === "string" ? req.query.patient_id.trim() : "";
    if (!patientId || patientId.length > 128) {
      return res.status(400).json({ error: "patient_id inválido", code: "VALIDATION_ERROR" });
    }
    const access = patientFor(req.user!, patientId);
    if (!access.patient) {
      return res.status(access.status).json({
        error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
        code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
      });
    }

    const daysRaw = typeof req.query.days === "string" ? Number(req.query.days) : 365;
    const days = Number.isFinite(daysRaw) ? Math.min(3650, Math.max(1, Math.round(daysRaw))) : 365;
    const eventTypes = parseEventTypes(req.query.types);
    if (eventTypes == null) {
      return res.status(400).json({ error: "types inválido", code: "VALIDATION_ERROR" });
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const placeholders = eventTypes.map(() => "?").join(", ");
    const typeClause = eventTypes.length ? ` AND event_type IN (${placeholders})` : "";
    const rows = sqlite
      .prepare(
        `SELECT id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
                provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,
                status, created_at
           FROM clinical_events
          WHERE patient_id = ? AND occurred_at >= ?${typeClause}
          ORDER BY occurred_at DESC
          LIMIT 2000`,
      )
      .all(patientId, cutoff, ...eventTypes) as StoredClinicalEventRow[];

    const data = rows.map(decodeRow).filter((item): item is ClinicalEvent => item != null);
    await logAudit({
      eventType: "result.read",
      context: getAuditContextFromRequest(req),
      targetType: "clinical_timeline",
      targetId: patientId,
      metadata: { count: data.length, days, eventTypes },
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ data, total: data.length, mode: "remote" });
  });

  app.post(
    "/api/clinical-core/events",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
      const parsed = clinicalEventInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Evento clínico inválido",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues,
        });
      }
      const input = parsed.data;
      const access = patientFor(req.user!, input.patientId);
      if (!access.patient) {
        return res.status(access.status).json({
          error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
          code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
        });
      }

      if (input.supersedesEventId) {
        const previous = sqlite
          .prepare("SELECT id, patient_id, status FROM clinical_events WHERE id = ? LIMIT 1")
          .get(input.supersedesEventId) as
            | { id: string; patient_id: string; status: ClinicalEventStatus }
            | undefined;
        if (!previous || previous.patient_id !== input.patientId) {
          return res.status(400).json({
            error: "Evento supersedido inválido para este paciente",
            code: "INVALID_SUPERSESSION",
          });
        }
        if (previous.status !== "active") {
          return res.status(409).json({
            error: "O evento já foi corrigido ou invalidado por outra operação.",
            code: "STALE_SUPERSESSION",
          });
        }
      }

      const id = `clinical-${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();
      const sensitive: SensitivePayload = {
        data: input.data,
        ...(input.note ? { note: input.note } : {}),
        ...(input.provenance.sourceLabel ? { sourceLabel: input.provenance.sourceLabel } : {}),
        ...(input.provenance.capturedAt ? { capturedAt: input.provenance.capturedAt } : {}),
      };
      const encryptedPayload = encrypt(JSON.stringify(sensitive));

      const transaction = sqlite.transaction(() => {
        if (input.supersedesEventId) {
          const correction = sqlite
            .prepare(
              "UPDATE clinical_events SET status = 'corrected' WHERE id = ? AND patient_id = ? AND status = 'active'",
            )
            .run(input.supersedesEventId, input.patientId);
          if (correction.changes !== 1) {
            const stale = new Error("STALE_SUPERSESSION") as Error & { code?: string };
            stale.code = "STALE_SUPERSESSION";
            throw stale;
          }
        }

        sqlite
          .prepare(
            `INSERT INTO clinical_events
              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
               provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,
               status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          .run(
            id,
            input.patientId,
            req.user!.id,
            input.eventType,
            input.occurredAt,
            input.encounterId ?? null,
            input.provenance.kind,
            input.provenance.source,
            encryptedPayload,
            input.supersedesEventId ?? null,
            createdAt,
          );
      });
      try {
        transaction();
      } catch (error) {
        if ((error as { code?: string }).code === "STALE_SUPERSESSION") {
          return res.status(409).json({
            error: "O evento já foi corrigido ou invalidado por outra operação.",
            code: "STALE_SUPERSESSION",
          });
        }
        throw error;
      }

      const created: ClinicalEvent = {
        id,
        ...input,
        authorUserId: req.user!.id,
        status: "active",
        createdAt,
        storageMode: "remote",
      };
      await logAudit({
        eventType: "result.create",
        context: getAuditContextFromRequest(req),
        targetType: "clinical_event",
        targetId: id,
        metadata: {
          patientId: input.patientId,
          eventType: input.eventType,
          provenanceKind: input.provenance.kind,
          supersedesEventId: input.supersedesEventId ?? null,
        },
      });
      return res.status(201).json(created);
    },
  );
}
