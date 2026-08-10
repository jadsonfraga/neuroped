/**
 * Rotas de upload/download de arquivos com URLs assinadas.
 *
 * Fluxo de upload:
 *  1. Cliente: POST /api/files/sign-upload com {filename, mimeType, size, category, patientId?}
 *  2. Server: valida, gera storage key, retorna {url, method, key, fileId}
 *  3. Cliente: PUT direto no bucket usando a url assinada
 *  4. Cliente: POST /api/files/:id/confirm para marcar como completo + obter sha256
 *
 * Fluxo de download:
 *  1. Cliente: GET /api/files/:id - retorna metadata + signed download URL
 *  2. Cliente: GET na URL assinada (segue redirect ou faz download direto)
 *
 * Auditoria:
 *  - Cada upload/download/delete e registrado em audit_logs
 *  - Tentativas de acesso a arquivo de outro usuario sao bloqueadas
 */

import type { Express, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../storage.js";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import {
  getUploadSignedUrl,
  getDownloadSignedUrl,
  deleteObject,
  headObject,
  generateStorageKey,
  CloudStorageConfigError,
  CloudStorageError,
} from "../lib/cloudStorage.js";
import { logAudit, getAuditContextFromRequest } from "../lib/audit.js";
import { oneParam } from "../lib/http.js";
import { patientReferenceDecision } from "../lib/ownership.js";
import { boundedIntegerEnv } from "../lib/runtimeConfig.js";

import { files as sqliteFiles, patients } from "@shared/schema";

const filesTable = sqliteFiles;

const MAX_FILE_SIZE_BYTES = boundedIntegerEnv("MAX_FILE_SIZE_MB", 50, 1, 2048) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "video/mp4",
  "video/webm",
  "text/plain",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const VALID_CATEGORIES = new Set([
  "laudo",
  "receita",
  "exame",
  "anamnese",
  "consentimento",
  "imagem-clinica",
  "audio-anamnese",
  "outros",
]);

export function registerFileRoutes(app: Express): void {
  /**
   * POST /api/files/sign-upload
   * Body: { filename, mimeType, size, category, patientId? }
   * Resp: { fileId, key, url, method, expiresInSeconds }
   */
  app.post("/api/files/sign-upload", requireAuth, requireProfessional, writeRateLimit, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    const schema = z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(3).max(120),
      size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
      category: z.string().min(1).max(40),
      patientId: z.string().uuid().optional(),
    }).strict();

    try {
      const parsed = schema.parse(req.body);

      if (!ALLOWED_MIME_TYPES.has(parsed.mimeType)) {
        return res.status(400).json({ error: "MIME type nao permitido", code: "MIME_NOT_ALLOWED" });
      }
      if (!VALID_CATEGORIES.has(parsed.category)) {
        return res.status(400).json({ error: "Categoria invalida", code: "CATEGORY_INVALID" });
      }
      if (parsed.patientId) {
        const patient = db
          .select()
          .from(patients)
          .where(eq(patients.id, parsed.patientId))
          .get();
        const decision = patientReferenceDecision(req.user!, patient);
        if (decision === "not_found") {
          return res.status(404).json({ error: "Paciente nao encontrado", code: "NOT_FOUND" });
        }
        if (decision === "forbidden") {
          return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
        }
      }

      const key = generateStorageKey({
        category: parsed.category,
        userId: req.user!.id,
        filename: parsed.filename,
      });

      const signed = await getUploadSignedUrl({
        key,
        contentType: parsed.mimeType,
        contentLength: parsed.size,
        metadata: {
          uploaded_by: req.user!.id,
          patient_id: parsed.patientId || "",
          category: parsed.category,
        },
      });

      if (parsed.patientId) {
        const freshPatient = db
          .select()
          .from(patients)
          .where(eq(patients.id, parsed.patientId))
          .get();
        const freshDecision = patientReferenceDecision(req.user!, freshPatient);
        if (freshDecision === "not_found") {
          return res.status(404).json({ error: "Paciente nao encontrado", code: "NOT_FOUND" });
        }
        if (freshDecision === "forbidden") {
          return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
        }
      }

      // Cria registro em files (status pendente — sha256 sera setado em /confirm)
      const created = db.insert(filesTable)
        .values({
          ownerUserId: req.user!.id,
          patientId: parsed.patientId || null,
          filename: parsed.filename,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.size,
          storageProvider: process.env.STORAGE_PROVIDER || "unknown",
          storageBucket: process.env.STORAGE_BUCKET || "unknown",
          storageKey: key,
          category: parsed.category,
          encryptionEnabled: true,
        })
        .returning()
        .get();

      await logAudit({
        eventType: "file.upload",
        context: ctx,
        targetType: "file",
        targetId: created.id,
        metadata: {
          filename: parsed.filename,
          mimeType: parsed.mimeType,
          size: parsed.size,
          patientId: parsed.patientId,
          category: parsed.category,
        },
      });

      return res.status(201).json({
        fileId: created.id,
        key,
        url: signed.url,
        method: signed.method,
        expiresInSeconds: signed.expiresInSeconds,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      }
      if (e instanceof CloudStorageConfigError) {
        return res.status(503).json({ error: "Storage nao configurado", code: "STORAGE_NOT_CONFIGURED" });
      }
      if (e instanceof CloudStorageError) {
        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });
      }
      console.error("[files.sign-upload]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  /**
   * POST /api/files/:id/confirm
   * Body: { sha256? }
   * Verifica que o objeto realmente foi enviado ao bucket.
   */
  app.post("/api/files/:id/confirm", requireAuth, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const file = db.select().from(filesTable).where(eq(filesTable.id, oneParam(req.params.id))).get();
      if (!file) return res.status(404).json({ error: "Arquivo nao encontrado" });
      if (file.ownerUserId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Sem permissao" });
      }

      const head = await headObject(file.storageKey);
      if (!head) {
        return res.status(400).json({ error: "Upload nao confirmado no bucket", code: "NOT_UPLOADED" });
      }

      // Valida tamanho
      if (head.contentLength !== file.sizeBytes) {
        await logAudit({
          eventType: "file.upload",
          context: ctx,
          targetType: "file",
          targetId: file.id,
          metadata: { reason: "size_mismatch", expected: file.sizeBytes, actual: head.contentLength },
          success: false,
        });
        return res.status(400).json({ error: "Tamanho divergente do esperado", code: "SIZE_MISMATCH" });
      }

      const sha = z.string().regex(/^[a-f0-9]{64}$/i).optional().parse(req.body?.sha256);
      const updated = db.update(filesTable)
        .set({ sha256: sha })
        .where(and(eq(filesTable.id, file.id), eq(filesTable.isDeleted, false)))
        .returning()
        .get();
      if (!updated) {
        return res.status(409).json({ error: "Arquivo mudou durante a confirmacao", code: "FILE_STATE_CHANGED" });
      }

      return res.json({
        ok: true,
        file: {
          id: updated.id,
          filename: updated.filename,
          mimeType: updated.mimeType,
          sizeBytes: updated.sizeBytes,
          sha256: updated.sha256,
          createdAt: updated.createdAt,
        },
      });
    } catch (e: any) {
      if (e instanceof CloudStorageError) {
        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });
      }
      console.error("[files.confirm]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  /**
   * GET /api/files/:id
   * Retorna metadata + URL assinada para download.
   */
  app.get("/api/files/:id", requireAuth, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const file = db.select().from(filesTable).where(eq(filesTable.id, oneParam(req.params.id))).get();
      if (!file || file.isDeleted) return res.status(404).json({ error: "Arquivo nao encontrado" });
      if (file.ownerUserId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Sem permissao" });
      }

      const signed = await getDownloadSignedUrl(file.storageKey);
      const freshFile = db.select().from(filesTable).where(eq(filesTable.id, file.id)).get();
      if (!freshFile || freshFile.isDeleted) {
        return res.status(404).json({ error: "Arquivo nao encontrado" });
      }
      if (freshFile.ownerUserId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Sem permissao" });
      }

      await logAudit({
        eventType: "file.download",
        context: ctx,
        targetType: "file",
        targetId: freshFile.id,
        metadata: { filename: freshFile.filename, patientId: freshFile.patientId },
      });

      return res.json({
        id: freshFile.id,
        filename: freshFile.filename,
        mimeType: freshFile.mimeType,
        sizeBytes: freshFile.sizeBytes,
        sha256: freshFile.sha256,
        category: freshFile.category,
        patientId: freshFile.patientId,
        createdAt: freshFile.createdAt,
        downloadUrl: signed.url,
        downloadExpiresInSeconds: signed.expiresInSeconds,
      });
    } catch (e: any) {
      if (e instanceof CloudStorageError) {
        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });
      }
      console.error("[files.get]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  /**
   * GET /api/files?patientId=...
   * Lista arquivos do usuario (filtravel por paciente).
   */
  app.get("/api/files", requireAuth, async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === "string" ? req.query.patientId : null;
    const rows = patientId
      ? db.select().from(filesTable).where(and(eq(filesTable.ownerUserId, req.user!.id), eq(filesTable.patientId, patientId))).all()
      : db.select().from(filesTable).where(eq(filesTable.ownerUserId, req.user!.id)).all();

    return res.json(
      rows
        .filter((r: any) => !r.isDeleted)
        .map((r: any) => ({
          id: r.id,
          filename: r.filename,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          category: r.category,
          patientId: r.patientId,
          createdAt: r.createdAt,
        })),
    );
  });

  /**
   * DELETE /api/files/:id
   * Soft-delete + remove do bucket (best-effort).
   */
  app.delete("/api/files/:id", requireAuth, requireProfessional, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const file = db.select().from(filesTable).where(eq(filesTable.id, oneParam(req.params.id))).get();
      if (!file || file.isDeleted) return res.status(404).json({ error: "Arquivo nao encontrado" });
      if (file.ownerUserId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Sem permissao" });
      }

      const deleted = db.update(filesTable)
        .set({ isDeleted: true, deletedAt: new Date().toISOString() })
        .where(and(eq(filesTable.id, file.id), eq(filesTable.isDeleted, false)))
        .returning()
        .get();
      if (!deleted) return res.status(404).json({ error: "Arquivo nao encontrado" });

      // Estado local é revogado antes da I/O remota. Assim outro request não recebe
      // uma nova URL assinada enquanto o bucket ainda está sendo apagado.
      try {
        await deleteObject(deleted.storageKey);
      } catch (e) {
        console.error("[files.delete] bucket delete failed:", e);
      }

      await logAudit({
        eventType: "file.delete",
        context: ctx,
        targetType: "file",
        targetId: deleted.id,
        metadata: { filename: deleted.filename },
      });

      return res.json({ ok: true });
    } catch (e: any) {
      console.error("[files.delete]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });
}
