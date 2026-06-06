/**
 * Rotas da API NeuroPed EDJ (versao fullstack-lgpd-backend).
 *
 * Convencoes:
 *  - Todas as rotas /api/* (exceto auth/login/refresh/logout) exigem autenticacao.
 *  - Toda criacao/leitura/modificacao de paciente registra audit log.
 *  - Campos sensiveis (nome, CPF, notas) sao criptografados em repouso (AES-GCM).
 *  - LGPD: pedidos de exportacao e exclusao tratados via /api/lgpd/*.
 *  - Email transacional: substituido execSync Perplexity por SMTP via nodemailer.
 */

import type { Express } from "express";
import { type Server } from "http";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, storage } from "./storage.js";
import { patients, consents, dataRequests, patientApiSchema, insertScaleResultSchema, insertConsentSchema } from "@shared/schema";
import { requireAuth, requireProfessional, optionalAuth } from "./middleware/auth.js";
import { writeRateLimit, emailRateLimit } from "./middleware/security.js";
import { patientToStorage, patientToPlaintext } from "./lib/patientCrypto.js";
import { oneParam } from "./lib/http.js";
import { logAudit, getAuditContextFromRequest } from "./lib/audit.js";
import { sendEmail } from "./lib/email.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerFileRoutes } from "./routes/files.js";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ----- Auth: register, login, refresh, logout, me, change-password -----
  registerAuthRoutes(app);

  // ----- Files: upload/download/list com URLs assinadas + cloud storage -----
  registerFileRoutes(app);

  // ----- Healthcheck publico -----
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      version: "2.1.0-cloud",
      storage: process.env.STORAGE_PROVIDER || "not-configured",
      database: process.env.DATABASE_URL ? "postgres" : "sqlite",
    });
  });

  // =========================================================================
  // PACIENTES — campos sensiveis criptografados em repouso
  // =========================================================================
  app.post("/api/patients", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = patientApiSchema.parse(req.body);
      const data = patientToStorage({ ...parsed, ownerUserId: req.user!.id });
      const created = db.insert(patients).values(data).returning().get();

      await logAudit({
        eventType: "patient.create",
        context: ctx,
        targetType: "patient",
        targetId: created.id,
      });
      return res.status(201).json(patientToPlaintext(created));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      console.error("[patients.create]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/patients", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const rows = db.select().from(patients).all();
    await logAudit({ eventType: "patient.read", context: ctx, metadata: { count: rows.length } });
    return res.json(rows.map(patientToPlaintext));
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const row = db.select().from(patients).where(eq(patients.id, oneParam(req.params.id))).get();
    if (!row) return res.status(404).json({ error: "Paciente nao encontrado" });
    await logAudit({
      eventType: "patient.read",
      context: ctx,
      targetType: "patient",
      targetId: row.id,
    });
    return res.json(patientToPlaintext(row));
  });

  app.patch("/api/patients/:id", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = patientApiSchema.partial().parse(req.body);
      const existing = db.select().from(patients).where(eq(patients.id, oneParam(req.params.id))).get();
      if (!existing) return res.status(404).json({ error: "Paciente nao encontrado" });

      const merged = patientToStorage({
        name: parsed.name ?? patientToPlaintext(existing).name,
        birthDate: parsed.birthDate ?? existing.birthDate ?? undefined,
        cpf: parsed.cpf ?? patientToPlaintext(existing).cpf ?? undefined,
        cid: parsed.cid ?? existing.cid ?? undefined,
        cidDescription: parsed.cidDescription ?? existing.cidDescription ?? undefined,
        notes: parsed.notes ?? patientToPlaintext(existing).notes ?? undefined,
      });

      const updated = db
        .update(patients)
        .set({ ...merged, updatedAt: new Date().toISOString() })
        .where(eq(patients.id, oneParam(req.params.id)))
        .returning()
        .get();

      await logAudit({
        eventType: "patient.update",
        context: ctx,
        targetType: "patient",
        targetId: updated.id,
        metadata: { fields: Object.keys(parsed) },
      });
      return res.json(patientToPlaintext(updated));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      console.error("[patients.update]", e);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/patients/:id", requireAuth, requireProfessional, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const ok = storage.deletePatient(oneParam(req.params.id));
    if (!ok) return res.status(404).json({ error: "Paciente nao encontrado" });
    await logAudit({
      eventType: "patient.delete",
      context: ctx,
      targetType: "patient",
      targetId: oneParam(req.params.id),
    });
    return res.json({ ok: true });
  });

  // =========================================================================
  // RESULTADOS DE ESCALAS
  // =========================================================================
  app.post("/api/results", requireAuth, writeRateLimit, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = insertScaleResultSchema.parse({
        ...req.body,
        appliedByUserId: req.user!.id,
      });
      const created = storage.saveResult(parsed);
      await logAudit({
        eventType: "result.create",
        context: ctx,
        targetType: "scale_result",
        targetId: created.id,
        metadata: { scaleName: created.scaleName, patientId: created.patientId },
      });
      return res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/results", requireAuth, (_req, res) => {
    res.json(storage.getResults());
  });

  app.get("/api/results/:id", requireAuth, (req, res) => {
    const r = storage.getResult(oneParam(req.params.id));
    if (!r) return res.status(404).json({ error: "Nao encontrado" });
    return res.json(r);
  });

  app.delete("/api/results/:id", requireAuth, requireProfessional, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const ok = storage.deleteResult(oneParam(req.params.id));
    if (!ok) return res.status(404).json({ error: "Nao encontrado" });
    await logAudit({
      eventType: "result.delete",
      context: ctx,
      targetType: "scale_result",
      targetId: oneParam(req.params.id),
    });
    return res.json({ ok: true });
  });

  app.get("/api/patients/:id/results", requireAuth, (req, res) => {
    res.json(storage.getResultsByPatient(oneParam(req.params.id)));
  });

  // =========================================================================
  // CONSENTIMENTOS LGPD
  // =========================================================================
  app.post("/api/consents", optionalAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = insertConsentSchema.parse({
        ...req.body,
        userId: req.user?.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      const created = db.insert(consents).values(parsed).returning().get();
      await logAudit({
        eventType: parsed.granted ? "consent.granted" : "consent.revoked",
        context: ctx,
        targetType: "consent",
        targetId: created.id,
        metadata: { type: parsed.consentType, version: parsed.consentVersion },
      });
      return res.status(201).json({
        id: created.id,
        consentType: created.consentType,
        granted: created.granted,
        grantedAt: created.grantedAt,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/consents", requireAuth, (req, res) => {
    const userConsents = db.select().from(consents).where(eq(consents.userId, req.user!.id)).all();
    res.json(userConsents);
  });

  // =========================================================================
  // LGPD — direitos do titular (art. 18)
  // =========================================================================
  app.post("/api/lgpd/export-request", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const created = db
      .insert(dataRequests)
      .values({
        requesterEmail: req.user!.email,
        requesterName: req.user!.name,
        requestType: "export",
        status: "pending",
        relatedPatientId: req.body?.patientId,
      })
      .returning()
      .get();
    await logAudit({
      eventType: "data.export.request",
      context: ctx,
      targetType: "data_request",
      targetId: created.id,
    });
    return res.status(201).json({
      id: created.id,
      status: created.status,
      message: "Solicitacao de exportacao registrada. Voce sera notificado em ate 15 dias (LGPD art. 19).",
    });
  });

  app.post("/api/lgpd/delete-request", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const created = db
      .insert(dataRequests)
      .values({
        requesterEmail: req.user!.email,
        requesterName: req.user!.name,
        requestType: "delete",
        status: "pending",
        relatedPatientId: req.body?.patientId,
        notes: req.body?.reason,
      })
      .returning()
      .get();
    await logAudit({
      eventType: "data.delete.request",
      context: ctx,
      targetType: "data_request",
      targetId: created.id,
    });
    return res.status(201).json({
      id: created.id,
      status: created.status,
      message: "Solicitacao de exclusao registrada. Sera processada em ate 15 dias.",
    });
  });

  // =========================================================================
  // EMAIL — envio de relatorio clinico (substitui execSync Perplexity)
  // =========================================================================
  app.post("/api/send-report", requireAuth, requireProfessional, emailRateLimit, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const schema = z.object({
      to: z.string().email().optional(),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(50_000),
      isHtml: z.boolean().default(false),
    });
    try {
      const parsed = schema.parse(req.body);
      const recipient = parsed.to || req.user!.email;
      const result = await sendEmail({
        to: recipient,
        subject: parsed.subject,
        text: parsed.isHtml ? undefined : parsed.body,
        html: parsed.isHtml ? parsed.body : undefined,
        replyTo: req.user!.email,
      });
      await logAudit({
        eventType: "lgpd.access",
        context: ctx,
        metadata: { action: "send_report", recipient },
      });
      return res.json({ ok: true, messageId: result.messageId });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      console.error("[send-report] error:", e);
      return res.status(500).json({
        error: "Falha ao enviar email",
        detail: process.env.NODE_ENV === "development" ? e.message : "Verifique configuracao SMTP em .env",
      });
    }
  });

  return httpServer;
}
