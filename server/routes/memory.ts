import type { Express } from "express";
import { memoryNoteInputSchema, memoryNotePatchSchema } from "@shared/memory";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { sqlite } from "../storage.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { canAccessPatient, isAdmin, type AuthzUser } from "../lib/ownership.js";
import { patients } from "@shared/schema";
import { db } from "../storage.js";
import { eq } from "drizzle-orm";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";

interface MemoryRow {
  id: string;
  patient_id: string | null;
  title_encrypted: string;
  content_encrypted: string;
  category: string | null;
  source: string | null;
  tags: string | null;
  author_user_id: string | null;
  created_at: string;
  updated_at: string;
}

function ensureMemorySchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS clinical_memory_notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      title_encrypted TEXT NOT NULL,
      content_encrypted TEXT NOT NULL,
      category TEXT,
      source TEXT,
      tags TEXT,
      author_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS clinical_memory_patient_idx
      ON clinical_memory_notes(patient_id, updated_at DESC);
  `);
}

function patientAllowed(user: AuthzUser, patientId: string | null) {
  if (!patientId) return isAdmin(user);
  const patient = db.select().from(patients).where(eq(patients.id, patientId)).get();
  return !!patient && canAccessPatient(user, patient);
}

function present(row: MemoryRow) {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tags ?? "[]");
    if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === "string");
  } catch { /* nota legada com tags inválidas */ }
  return {
    id: row.id,
    patientId: row.patient_id,
    title: decrypt(row.title_encrypted) ?? "",
    content: decrypt(row.content_encrypted) ?? "",
    category: row.category,
    source: row.source,
    tags,
    authorUserId: row.author_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function registerMemoryRoutes(app: Express) {
  ensureMemorySchema();

  app.get("/api/memory", requireAuth, (req, res) => {
    const patientId = typeof req.query.patient_id === "string" ? req.query.patient_id.trim() : "";
    const query = typeof req.query.q === "string" ? req.query.q.trim().toLocaleLowerCase("pt-BR") : "";
    if (!patientId && !isAdmin(req.user!)) {
      return res.status(400).json({ error: "Selecione um paciente", code: "PATIENT_REQUIRED" });
    }
    if (patientId && !patientAllowed(req.user!, patientId)) {
      return res.status(403).json({ error: "Sem permissão", code: "FORBIDDEN" });
    }
    const rows = sqlite.prepare(
      `SELECT * FROM clinical_memory_notes
       WHERE (? = '' OR patient_id = ?)
       ORDER BY updated_at DESC LIMIT 500`,
    ).all(patientId, patientId) as MemoryRow[];
    const data = rows.map(present).filter((note) => !query ||
      `${note.title} ${note.content} ${note.category ?? ""} ${note.tags.join(" ")}`
        .toLocaleLowerCase("pt-BR").includes(query));
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ data: data.slice(0, 100), total: data.length, mode: "remote" });
  });

  app.post("/api/memory", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const parsed = memoryNoteInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Nota inválida", code: "VALIDATION_ERROR", details: parsed.error.issues });
    const input = parsed.data;
    const patientId = input.patientId ?? null;
    if (!patientAllowed(req.user!, patientId)) return res.status(403).json({ error: "Sem permissão", code: "FORBIDDEN" });
    const id = `memory-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    sqlite.prepare(`INSERT INTO clinical_memory_notes
      (id, patient_id, title_encrypted, content_encrypted, category, source, tags, author_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, patientId, encrypt(input.title), encrypt(input.content), input.category ?? null,
        input.source ?? "registro_clinico", JSON.stringify(input.tags), req.user!.id, now, now);
    await logAudit({ eventType: "result.create", context: getAuditContextFromRequest(req), targetType: "memory_note", targetId: id, metadata: { patientId } });
    const row = sqlite.prepare("SELECT * FROM clinical_memory_notes WHERE id = ?").get(id) as MemoryRow;
    return res.status(201).json(present(row));
  });

  app.patch("/api/memory/:id", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const row = sqlite.prepare("SELECT * FROM clinical_memory_notes WHERE id = ?").get(req.params.id) as MemoryRow | undefined;
    if (!row) return res.status(404).json({ error: "Nota não encontrada", code: "NOT_FOUND" });
    if (!patientAllowed(req.user!, row.patient_id)) return res.status(403).json({ error: "Sem permissão", code: "FORBIDDEN" });
    const parsed = memoryNotePatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Atualização inválida", code: "VALIDATION_ERROR", details: parsed.error.issues });
    const current = present(row);
    const next = memoryNoteInputSchema.parse({
      patientId: parsed.data.patientId ?? current.patientId ?? undefined,
      title: parsed.data.title ?? current.title,
      content: parsed.data.content ?? current.content,
      category: parsed.data.category ?? current.category ?? undefined,
      source: parsed.data.source ?? current.source ?? undefined,
      tags: parsed.data.tags ?? current.tags,
    });
    const nextPatientId = next.patientId ?? null;
    if (!patientAllowed(req.user!, nextPatientId)) return res.status(403).json({ error: "Sem permissão", code: "FORBIDDEN" });
    const now = new Date().toISOString();
    sqlite.prepare(`UPDATE clinical_memory_notes SET patient_id=?, title_encrypted=?, content_encrypted=?, category=?, source=?, tags=?, updated_at=? WHERE id=?`)
      .run(nextPatientId, encrypt(next.title), encrypt(next.content), next.category ?? null, next.source ?? null, JSON.stringify(next.tags), now, row.id);
    await logAudit({ eventType: "result.update", context: getAuditContextFromRequest(req), targetType: "memory_note", targetId: row.id, metadata: { patientId: nextPatientId } });
    return res.json(present(sqlite.prepare("SELECT * FROM clinical_memory_notes WHERE id = ?").get(row.id) as MemoryRow));
  });

  app.delete("/api/memory/:id", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const row = sqlite.prepare("SELECT * FROM clinical_memory_notes WHERE id = ?").get(req.params.id) as MemoryRow | undefined;
    if (!row) return res.status(404).json({ error: "Nota não encontrada", code: "NOT_FOUND" });
    if (!patientAllowed(req.user!, row.patient_id)) return res.status(403).json({ error: "Sem permissão", code: "FORBIDDEN" });
    sqlite.prepare("DELETE FROM clinical_memory_notes WHERE id = ?").run(row.id);
    await logAudit({ eventType: "result.delete", context: getAuditContextFromRequest(req), targetType: "memory_note", targetId: row.id, metadata: { patientId: row.patient_id } });
    return res.status(204).send();
  });
}
