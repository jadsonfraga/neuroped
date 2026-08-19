import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  clinicalDocumentSignatureStatuses,
  clinicalDocumentTypes,
  clinicalDocuments,
  files,
  patients,
} from "@shared/schema";
import { db } from "../storage.js";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { getDownloadSignedUrl, getObjectSha256, CloudStorageError } from "../lib/cloudStorage.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";
import { oneParam } from "../lib/http.js";
import { patientReferenceDecision } from "../lib/ownership.js";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i, "SHA-256 invalido");

const createDocumentSchema = z
  .object({
    fileId: z.string().uuid(),
    patientId: z.string().uuid().nullable().optional(),
    documentType: z.enum(clinicalDocumentTypes),
    title: z.string().trim().min(1).max(200),
    sourceId: z.string().trim().max(120).nullable().optional(),
    sourceVersion: z.string().trim().max(40).nullable().optional(),
    signatureStatus: z.enum(clinicalDocumentSignatureStatuses).default("unsigned"),
    signatureType: z.string().trim().max(80).nullable().optional(),
    signatureAlgorithm: z.string().trim().max(80).nullable().optional(),
    signerName: z.string().trim().max(160).nullable().optional(),
    certificateSubject: z.string().trim().max(500).nullable().optional(),
    certificateIssuer: z.string().trim().max(500).nullable().optional(),
    certificateSerial: z.string().trim().max(200).nullable().optional(),
    certificateValidUntil: z.string().datetime().nullable().optional(),
    sha256: sha256Schema.nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

function presentDocument(row: any) {
  let metadata: Record<string, unknown> | null = null;
  if (typeof row.metadata === "string") {
    try {
      const parsed = JSON.parse(row.metadata);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) metadata = parsed;
    } catch {
      metadata = null;
    }
  }
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    patientId: row.patientId,
    fileId: row.fileId,
    documentType: row.documentType,
    title: row.title,
    sourceId: row.sourceId,
    sourceVersion: row.sourceVersion,
    signatureStatus: row.signatureStatus,
    signatureType: row.signatureType,
    signatureAlgorithm: row.signatureAlgorithm,
    signerName: row.signerName,
    certificateSubject: row.certificateSubject,
    certificateIssuer: row.certificateIssuer,
    certificateSerial: row.certificateSerial,
    certificateValidUntil: row.certificateValidUntil,
    sha256: row.sha256,
    retentionPolicy: row.retentionPolicy,
    isImmutable: Boolean(row.isImmutable),
    metadata,
    createdAt: row.createdAt,
  };
}

function canAccessDocument(user: { id: string; role: string }, row: any): boolean {
  return user.role === "admin" || row.ownerUserId === user.id;
}

export function registerDocumentRoutes(app: Express): void {
  app.post(
    "/api/documents",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req: Request, res: Response) => {
      const context = getAuditContextFromRequest(req);
      try {
        const parsed = createDocumentSchema.parse(req.body);
        const file = db.select().from(files).where(eq(files.id, parsed.fileId)).get();
        if (!file || file.isDeleted) {
          return res.status(404).json({ error: "Arquivo PDF nao encontrado", code: "FILE_NOT_FOUND" });
        }
        if (file.ownerUserId !== (req as any).user!.id && (req as any).user!.role !== "admin") {
          return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
        }
        if (file.mimeType !== "application/pdf") {
          return res.status(400).json({ error: "Documento clinico deve ser um PDF", code: "PDF_REQUIRED" });
        }
        if (!file.sha256) {
          return res.status(409).json({
            error: "O PDF ainda nao foi confirmado pelo servidor",
            code: "FILE_NOT_CONFIRMED",
          });
        }
        if (parsed.sha256 && parsed.sha256.toLowerCase() !== file.sha256.toLowerCase()) {
          return res.status(400).json({ error: "Hash do documento nao coincide com o arquivo confirmado", code: "HASH_MISMATCH" });
        }

        if (file.patientId && parsed.patientId && file.patientId !== parsed.patientId) {
          return res.status(409).json({
            error: "O paciente do documento deve coincidir com o paciente do arquivo",
            code: "PATIENT_FILE_MISMATCH",
          });
        }

        if (parsed.patientId) {
          const patient = db.select().from(patients).where(eq(patients.id, parsed.patientId)).get();
          const decision = patientReferenceDecision((req as any).user!, patient);
          if (decision === "not_found") return res.status(404).json({ error: "Paciente nao encontrado", code: "PATIENT_NOT_FOUND" });
          if (decision === "forbidden") return res.status(403).json({ error: "Sem permissao para o paciente", code: "FORBIDDEN" });
        }

        const existing = db.select({ id: clinicalDocuments.id })
          .from(clinicalDocuments)
          .where(eq(clinicalDocuments.fileId, parsed.fileId))
          .get();
        if (existing) {
          return res.status(409).json({ error: "Este PDF ja esta arquivado como documento clinico", code: "DOCUMENT_ALREADY_REGISTERED", documentId: existing.id });
        }

        const created = db.insert(clinicalDocuments).values({
          ownerUserId: (req as any).user!.id,
          patientId: parsed.patientId ?? file.patientId ?? null,
          fileId: parsed.fileId,
          documentType: parsed.documentType,
          title: parsed.title,
          sourceId: parsed.sourceId ?? null,
          sourceVersion: parsed.sourceVersion ?? null,
          signatureStatus: parsed.signatureStatus,
          signatureType: parsed.signatureType ?? null,
          signatureAlgorithm: parsed.signatureAlgorithm ?? null,
          signerName: parsed.signerName ?? null,
          certificateSubject: parsed.certificateSubject ?? null,
          certificateIssuer: parsed.certificateIssuer ?? null,
          certificateSerial: parsed.certificateSerial ?? null,
          certificateValidUntil: parsed.certificateValidUntil ?? null,
          sha256: file.sha256,
          retentionPolicy: "permanent",
          isImmutable: true,
          metadata: parsed.metadata ? JSON.stringify(parsed.metadata) : null,
        }).returning().get();

        await logAudit({
          eventType: "document.create",
          context,
          targetType: "clinical_document",
          targetId: created.id,
          metadata: {
            documentType: created.documentType,
            signatureStatus: created.signatureStatus,
            patientId: created.patientId,
            fileId: created.fileId,
            sha256: created.sha256,
            retentionPolicy: created.retentionPolicy,
          },
        });

        return res.status(201).json({ document: presentDocument(created) });
      } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: error.errors });
        console.error("[documents.create]", error);
        return res.status(500).json({ error: "Erro interno" });
      }
    },
  );

  app.get("/api/documents", requireAuth, async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === "string" ? req.query.patientId : null;
    const documentType = typeof req.query.type === "string" && clinicalDocumentTypes.includes(req.query.type as any)
      ? (req.query.type as (typeof clinicalDocumentTypes)[number])
      : null;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);

    const predicates = [
      (req as any).user!.role === "admin" ? undefined : eq(clinicalDocuments.ownerUserId, (req as any).user!.id),
      patientId ? eq(clinicalDocuments.patientId, patientId) : undefined,
      documentType ? eq(clinicalDocuments.documentType, documentType) : undefined,
    ].filter(Boolean) as any[];

    const rows = db.select().from(clinicalDocuments)
      .where(predicates.length ? and(...predicates) : undefined)
      .orderBy(desc(clinicalDocuments.createdAt))
      .limit(limit)
      .all();

    await logAudit({
      eventType: "document.read",
      context: getAuditContextFromRequest(req),
      targetType: "clinical_document",
      metadata: { count: rows.length, patientId, documentType },
    });
    return res.json({ data: rows.map(presentDocument), retentionPolicy: "permanent" });
  });

  app.get("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    const context = getAuditContextFromRequest(req);
    try {
      const row = db.select().from(clinicalDocuments).where(eq(clinicalDocuments.id, oneParam(req.params.id))).get();
      if (!row) return res.status(404).json({ error: "Documento nao encontrado" });
      if (!canAccessDocument((req as any).user!, row)) return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
      if (!row.fileId) return res.status(409).json({ error: "Documento sem arquivo persistido", code: "FILE_REFERENCE_MISSING" });
      const file = db.select().from(files).where(eq(files.id, row.fileId)).get();
      if (!file || file.isDeleted) return res.status(410).json({ error: "Arquivo do documento indisponivel", code: "ARCHIVE_MISSING" });
      const signed = await getDownloadSignedUrl(file.storageKey);
      await logAudit({ eventType: "document.read", context, targetType: "clinical_document", targetId: row.id });
      return res.json({ document: presentDocument(row), downloadUrl: signed.url, downloadExpiresInSeconds: signed.expiresInSeconds });
    } catch (error) {
      if (error instanceof CloudStorageError) return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });
      console.error("[documents.get]", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/documents/:id/verify", requireAuth, async (req: Request, res: Response) => {
    const context = getAuditContextFromRequest(req);
    const row = db.select().from(clinicalDocuments).where(eq(clinicalDocuments.id, oneParam(req.params.id))).get();
    if (!row) return res.status(404).json({ error: "Documento nao encontrado" });
    if (!canAccessDocument((req as any).user!, row)) return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
    const file = row.fileId ? db.select().from(files).where(eq(files.id, row.fileId)).get() : null;
    if (!file || file.isDeleted) {
      await logAudit({ eventType: "document.verify", context, targetType: "clinical_document", targetId: row.id, metadata: { verified: false, reason: "archive_missing" } });
      return res.json({ verified: false, sha256Match: false, signatureStatus: row.signatureStatus, sha256: row.sha256, message: "Nao foi possivel confirmar a integridade do arquivo arquivado." });
    }

    try {
      const object = await getObjectSha256(file.storageKey);
      const sha256Match = Boolean(object && row.sha256 && object.sha256.toLowerCase() === row.sha256.toLowerCase());
      const sizeMatch = Boolean(object && object.contentLength === file.sizeBytes);
      const mimeMatch = Boolean(object && (!object.contentType || object.contentType.toLowerCase() === file.mimeType.toLowerCase()));
      const verified = Boolean(object && !file.isDeleted && sha256Match && sizeMatch && mimeMatch);
      await logAudit({ eventType: "document.verify", context, targetType: "clinical_document", targetId: row.id, metadata: { verified, sha256Match, sizeMatch, mimeMatch } });
      return res.json({ verified, sha256Match, sizeMatch, mimeMatch, signatureStatus: row.signatureStatus, sha256: row.sha256, message: verified ? "Integridade do arquivo confirmada por digest SHA-256 calculado no servidor." : "Nao foi possivel confirmar a integridade do arquivo arquivado." });
    } catch (error) {
      if (error instanceof CloudStorageError) return res.status(503).json({ error: "Storage indisponivel para verificar o documento", code: "STORAGE_UNAVAILABLE" });
      console.error("[documents.verify]", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, requireProfessional, async (req: Request, res: Response) => {
    const context = getAuditContextFromRequest(req);
    const row = db.select().from(clinicalDocuments).where(eq(clinicalDocuments.id, oneParam(req.params.id))).get();
    if (!row) return res.status(404).json({ error: "Documento nao encontrado" });
    if (!canAccessDocument((req as any).user!, row)) return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
    await logAudit({ eventType: "document.delete", context, targetType: "clinical_document", targetId: row.id, success: false, metadata: { reason: "permanent_retention" } });
    return res.status(409).json({ error: "Documento clinico protegido por retencao permanente e imutabilidade.", code: "PERMANENT_RETENTION" });
  });
}
