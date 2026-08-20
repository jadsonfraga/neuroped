import type { Express } from "express";
import { patients } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  clinicalEventInputSchema,
  encounterTypes,
  type ClinicalEventStatus,
} from "@shared/clinical-core";
import { db, sqlite } from "../storage.js";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { canAccessPatient, type AuthzUser } from "../lib/ownership.js";
import { decrypt, encrypt } from "../lib/crypto.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";
import { ensureClinicalCoreSchema } from "./clinical-core.js";

const consultationFields = ["subjective", "objective", "assessment", "plan"] as const;
type ConsultationField = (typeof consultationFields)[number];

interface StoredConsultationRow {
  id: string;
  patient_id: string;
  occurred_at: string;
  payload_encrypted: string;
  status: ClinicalEventStatus;
  created_at: string;
}

interface ConsultationPayload {
  data?: Record<string, unknown>;
  note?: string;
}

function patientFor(user: AuthzUser, patientId: string) {
  const patient = db.select().from(patients).where(eq(patients.id, patientId)).get();
  if (!patient) return { status: 404 as const, patient: null };
  if (!canAccessPatient(user, patient)) return { status: 403 as const, patient: null };
  return { status: 200 as const, patient };
}

function asOptionalText(value: unknown, max: number): string | null | "INVALID" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "INVALID";
  const text = value.trim();
  if (text.length > max) return "INVALID";
  return text || null;
}

function normalizeDate(value: unknown): string | null {
  if (value == null || value === "") return new Date().toISOString();
  if (typeof value !== "string") return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function present(row: StoredConsultationRow) {
  try {
    const raw = decrypt(row.payload_encrypted);
    if (!raw) return null;
    const decoded = JSON.parse(raw) as ConsultationPayload;
    const data = decoded.data && typeof decoded.data === "object" ? decoded.data : {};
    const text = (field: ConsultationField): string | null =>
      typeof data[field] === "string" ? (data[field] as string) : null;
    const appointmentId = typeof data.appointmentId === "string" ? data.appointmentId : null;
    return {
      id: row.id,
      patient_id: row.patient_id,
      date: row.occurred_at,
      subjective: text("subjective"),
      objective: text("objective"),
      assessment: text("assessment"),
      plan: text("plan"),
      appointment_id: appointmentId,
      is_demo: false,
      created_at: row.created_at,
    };
  } catch {
    return null;
  }
}

export function registerConsultationRoutes(app: Express): void {
  ensureClinicalCoreSchema();

  app.get("/api/consultations", requireAuth, async (req, res) => {
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

    const rows = sqlite
      .prepare(
        `SELECT id, patient_id, occurred_at, payload_encrypted, status, created_at
           FROM clinical_events
          WHERE patient_id = ? AND event_type = 'encounter' AND status = 'active'
          ORDER BY occurred_at DESC
          LIMIT 100`,
      )
      .all(patientId) as StoredConsultationRow[];
    const data = rows.map(present).filter((item): item is NonNullable<ReturnType<typeof present>> => item != null);

    await logAudit({
      eventType: "result.read",
      context: getAuditContextFromRequest(req),
      targetType: "consultation",
      targetId: patientId,
      metadata: { count: data.length },
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ data, total: data.length, mode: "remote" });
  });

  app.post(
    "/api/consultations",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
      const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body as Record<string, unknown> : null;
      if (!body) return res.status(400).json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" });

      const patientId = asOptionalText(body.patient_id, 128);
      if (!patientId || patientId === "INVALID") {
        return res.status(400).json({ error: "patient_id é obrigatório.", code: "VALIDATION_ERROR" });
      }
      const occurredAt = normalizeDate(body.date);
      if (!occurredAt) return res.status(400).json({ error: "date inválida.", code: "VALIDATION_ERROR" });

      const sections: Record<ConsultationField, string | null> = {
        subjective: null,
        objective: null,
        assessment: null,
        plan: null,
      };
      let totalCharacters = 0;
      for (const field of consultationFields) {
        const value = asOptionalText(body[field], 5_000);
        if (value === "INVALID") {
          return res.status(400).json({ error: `${field} deve ser texto com até 5.000 caracteres.`, code: "VALIDATION_ERROR" });
        }
        sections[field] = value;
        totalCharacters += value?.length ?? 0;
      }
      if (totalCharacters > 12_000) {
        return res.status(400).json({ error: "Os campos clínicos devem somar no máximo 12.000 caracteres.", code: "VALIDATION_ERROR" });
      }

      const access = patientFor(req.user!, patientId);
      if (!access.patient) {
        return res.status(access.status).json({
          error: access.status === 404 ? "Paciente não encontrado" : "Sem permissão",
          code: access.status === 404 ? "NOT_FOUND" : "FORBIDDEN",
        });
      }

      const appointmentId = asOptionalText(body.appointment_id, 128);
      if (appointmentId === "INVALID") {
        return res.status(400).json({ error: "appointment_id inválido.", code: "VALIDATION_ERROR" });
      }
      let appointment: { id: string; patient_id: string | null } | undefined;
      if (appointmentId) {
        appointment = sqlite
          .prepare("SELECT id, patient_id FROM appointments WHERE id = ? AND provider_user_id = ? LIMIT 1")
          .get(appointmentId, req.user!.id) as { id: string; patient_id: string | null } | undefined;
        if (!appointment) return res.status(404).json({ error: "Consulta da agenda não encontrada.", code: "APPOINTMENT_NOT_FOUND" });
        if (appointment.patient_id && appointment.patient_id !== patientId) {
          return res.status(409).json({ error: "A consulta já está vinculada a outro paciente.", code: "APPOINTMENT_PATIENT_CONFLICT" });
        }
      }

      const encounterTypeRaw = typeof body.encounter_type === "string" ? body.encounter_type : "followup";
      const encounterType = encounterTypes.includes(encounterTypeRaw as (typeof encounterTypes)[number])
        ? encounterTypeRaw as (typeof encounterTypes)[number]
        : null;
      if (!encounterType) return res.status(400).json({ error: "encounter_type inválido.", code: "VALIDATION_ERROR" });

      const reason = asOptionalText(body.reason, 500);
      const note = asOptionalText(body.note, 5_000);
      if (reason === "INVALID" || note === "INVALID") {
        return res.status(400).json({ error: "reason ou note excede o limite permitido.", code: "VALIDATION_ERROR" });
      }
      const settingRaw = typeof body.setting === "string" ? body.setting : "clinic";
      const settings = ["clinic", "telemedicine", "hospital", "school", "home", "other"] as const;
      if (!settings.includes(settingRaw as (typeof settings)[number])) {
        return res.status(400).json({ error: "setting inválido.", code: "VALIDATION_ERROR" });
      }

      const input = {
        patientId,
        eventType: "encounter" as const,
        occurredAt,
        provenance: { kind: "documented" as const, source: "clinician" as const },
        ...(note ? { note } : {}),
        data: {
          encounterType,
          ...(reason ? { reason } : {}),
          setting: settingRaw as (typeof settings)[number],
          ...(appointmentId ? { appointmentId } : {}),
          ...Object.fromEntries(
            consultationFields.filter((field) => sections[field] != null).map((field) => [field, sections[field]]),
          ),
        },
      };
      const parsed = clinicalEventInputSchema.safeParse(input);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados clínicos inválidos.", code: "VALIDATION_ERROR", details: parsed.error.issues });
      }

      const id = `clinical-${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();
      const encryptedPayload = encrypt(JSON.stringify({ data: parsed.data.data, ...(parsed.data.note ? { note: parsed.data.note } : {}) }));
      const transaction = sqlite.transaction(() => {
        if (appointment && !appointment.patient_id) {
          sqlite.prepare("UPDATE appointments SET patient_id = ?, updated_at = ? WHERE id = ? AND patient_id IS NULL").run(patientId, createdAt, appointment.id);
        }
        return sqlite
          .prepare(
            `INSERT INTO clinical_events
              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
               provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,
               status, created_at)
             VALUES (?, ?, ?, 'encounter', ?, NULL, 'documented', 'clinician', ?, NULL, 'active', ?)`,
          )
          .run(id, patientId, req.user!.id, occurredAt, encryptedPayload, createdAt).changes === 1;
      });
      if (!transaction()) return res.status(500).json({ error: "Não foi possível persistir a consulta.", code: "DB_ERROR" });

      const response = {
        id,
        patient_id: patientId,
        date: occurredAt,
        ...sections,
        appointment_id: appointmentId ?? null,
        is_demo: false,
        created_at: createdAt,
      };
      await logAudit({
        eventType: "result.create",
        context: getAuditContextFromRequest(req),
        targetType: "consultation",
        targetId: id,
        metadata: { patientId, appointmentId: appointmentId ?? null },
      });
      return res.status(201).json(response);
    },
  );
}
