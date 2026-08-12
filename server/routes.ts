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
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { db, storage } from "./storage.js";
import {
  patients,
  dataRequests,
  patientApiSchema,
  insertScaleResultSchema,
} from "@shared/schema";
import { requireAuth, requireProfessional } from "./middleware/auth.js";
import { writeRateLimit, emailRateLimit } from "./middleware/security.js";
import { patientToStorage, patientToPlaintext } from "./lib/patientCrypto.js";
import { oneParam } from "./lib/http.js";
import { logAudit, getAuditContextFromRequest } from "./lib/audit.js";
import { sendEmail } from "./lib/email.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerConsentRoutes } from "./routes/consents.js";
import { registerConectaRoutes } from "./routes/conecta.js";
import { registerClinicalCoreRoutes } from "./routes/clinical-core.js";
import {
  canAccessPatient,
  canAccessScaleResult,
  isAdmin,
  patientReferenceDecision,
} from "./lib/ownership.js";
import { buildExpressHealth } from "./lib/healthContract.js";

const PROFESSIONAL_REPORT_EMAIL = "drjadsonfraga@proton.me";

function normalizeScaleResponses(
  value: unknown,
): Array<{ question: string; answer: string }> {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const normalized: Array<{ question: string; answer: string }> = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const questionValue = (item as Record<string, unknown>).question;
    const answerValue = (item as Record<string, unknown>).answer;
    if (typeof questionValue !== "string") return [];
    if (answerValue != null && typeof answerValue !== "string") return [];
    const question = questionValue.trim();
    const answer = typeof answerValue === "string" ? answerValue.trim() : "";
    if (!question) return [];
    normalized.push({ question, answer: answer || "Não respondida" });
  }
  return normalized;
}

function presentScaleResponseRecord(result: any) {
  const safe = { ...result };
  const responses = normalizeScaleResponses(safe.answers);
  delete safe.answers;
  delete safe.totalScore;
  delete safe.classification;
  delete safe.domainScores;
  return { ...safe, responses };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ----- Auth: register, login, refresh, logout, me, change-password -----
  registerAuthRoutes(app);

  // ----- Files: upload/download/list com URLs assinadas + cloud storage -----
  registerFileRoutes(app);

  // ----- Consentimentos: lote autenticado, atômico, idempotente e auditado -----
  registerConsentRoutes(app);

  // ----- NeuroPed Conecta: jornada longitudinal nativa com ownership do paciente -----
  registerConectaRoutes(app);

  // ----- Clinical Core: ledger longitudinal canônico e rastreável -----
  registerClinicalCoreRoutes(app);

  // ----- Healthcheck publico -----
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(buildExpressHealth());
  });

  // =========================================================================
  // PACIENTES — campos sensiveis criptografados em repouso
  // =========================================================================
  app.post(
    "/api/patients",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
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
        if (e instanceof z.ZodError)
          return res
            .status(400)
            .json({ error: "Dados invalidos", details: e.errors });
        console.error("[patients.create]", e);
        return res.status(500).json({ error: "Erro interno" });
      }
    },
  );

  app.get("/api/patients", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    // Clamp inferior obrigatório: LIMIT negativo no SQLite significa "sem
    // limite" e furaria o teto de 100 itens por página.
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const query = isAdmin(req.user!)
      ? db.select().from(patients)
      : db.select().from(patients).where(eq(patients.ownerUserId, req.user!.id));

    const rows = query.limit(limit).offset(offset).all();
    const countResult = isAdmin(req.user!)
      ? db.select({ count: count() }).from(patients).all()
      : db.select({ count: count() }).from(patients).where(eq(patients.ownerUserId, req.user!.id)).all();

    const total = countResult[0]?.count || 0;

    await logAudit({
      eventType: "patient.read",
      context: ctx,
      metadata: { count: rows.length, total, limit, offset },
    });
    return res.json({
      data: rows.map(patientToPlaintext),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const row = db
      .select()
      .from(patients)
      .where(eq(patients.id, oneParam(req.params.id)))
      .get();
    if (!row) return res.status(404).json({ error: "Paciente nao encontrado" });
    if (!canAccessPatient(req.user!, row))
      return res
        .status(403)
        .json({ error: "Sem permissao", code: "FORBIDDEN" });
    await logAudit({
      eventType: "patient.read",
      context: ctx,
      targetType: "patient",
      targetId: row.id,
    });
    return res.json(patientToPlaintext(row));
  });

  app.patch(
    "/api/patients/:id",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req, res) => {
      const ctx = getAuditContextFromRequest(req);
      try {
        const parsed = patientApiSchema.partial().parse(req.body);
        const existing = db
          .select()
          .from(patients)
          .where(eq(patients.id, oneParam(req.params.id)))
          .get();
        if (!existing)
          return res.status(404).json({ error: "Paciente nao encontrado" });
        if (!canAccessPatient(req.user!, existing))
          return res
            .status(403)
            .json({ error: "Sem permissao", code: "FORBIDDEN" });

        const merged = patientToStorage({
          ownerUserId: existing.ownerUserId,
          name: parsed.name ?? patientToPlaintext(existing).name,
          birthDate: parsed.birthDate ?? existing.birthDate ?? undefined,
          cpf: parsed.cpf ?? patientToPlaintext(existing).cpf ?? undefined,
          cid: parsed.cid ?? existing.cid ?? undefined,
          cidDescription:
            parsed.cidDescription ?? existing.cidDescription ?? undefined,
          notes:
            parsed.notes ?? patientToPlaintext(existing).notes ?? undefined,
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
        if (e instanceof z.ZodError)
          return res
            .status(400)
            .json({ error: "Dados invalidos", details: e.errors });
        console.error("[patients.update]", e);
        return res.status(500).json({ error: "Erro interno" });
      }
    },
  );

  app.delete(
    "/api/patients/:id",
    requireAuth,
    requireProfessional,
    async (req, res) => {
      const ctx = getAuditContextFromRequest(req);
      const existing = db
        .select()
        .from(patients)
        .where(eq(patients.id, oneParam(req.params.id)))
        .get();
      if (!existing)
        return res.status(404).json({ error: "Paciente nao encontrado" });
      if (!canAccessPatient(req.user!, existing))
        return res
          .status(403)
          .json({ error: "Sem permissao", code: "FORBIDDEN" });
      const ok = storage.deletePatient(oneParam(req.params.id));
      if (!ok)
        return res.status(404).json({ error: "Paciente nao encontrado" });
      await logAudit({
        eventType: "patient.delete",
        context: ctx,
        targetType: "patient",
        targetId: oneParam(req.params.id),
      });
      return res.json({ ok: true });
    },
  );

  // =========================================================================
  // RESULTADOS DE ESCALAS
  // =========================================================================
  app.post("/api/results", requireAuth, requireProfessional, writeRateLimit, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const responses = normalizeScaleResponses(
        req.body?.responses ?? req.body?.answers,
      );
      if (responses.length === 0) {
        return res.status(400).json({
          error: "Envie todas as perguntas e respostas por extenso.",
          code: "RESPONSES_REQUIRED",
        });
      }
      const parsed = insertScaleResultSchema.parse({
        ...req.body,
        answers: JSON.stringify(responses),
        // Colunas legadas obrigatórias permanecem neutras no armazenamento e
        // nunca são devolvidas pela API. O produto entrega somente respostas.
        totalScore: 0,
        classification: "Respostas registradas",
        domainScores: null,
        appliedByUserId: req.user!.id,
      });
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
      const created = storage.saveResult(parsed);
      await logAudit({
        eventType: "result.create",
        context: ctx,
        targetType: "scale_result",
        targetId: created.id,
        metadata: {
          scaleName: created.scaleName,
          patientId: created.patientId,
        },
      });
      return res.status(201).json(presentScaleResponseRecord(created));
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return res
          .status(400)
          .json({ error: "Dados invalidos", details: e.errors });
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/results", requireAuth, (req, res) => {
    // Antes: getResults() trazia a tabela INTEIRA para memória e, por linha,
    // disparava uma query síncrona extra para checar dono do paciente (N+1) —
    // sem LIMIT, degradava linearmente com o crescimento da tabela. Agora o
    // filtro de ownership e o LIMIT vivem na própria query (getResultsAccessibleBy).
    const accessible = storage.getResultsAccessibleBy(req.user!);
    return res.json(accessible.map(presentScaleResponseRecord));
  });

  app.get("/api/results/:id", requireAuth, (req, res) => {
    const r = storage.getResult(oneParam(req.params.id));
    if (!r) return res.status(404).json({ error: "Nao encontrado" });
    const patient = r.patientId
      ? db.select().from(patients).where(eq(patients.id, r.patientId)).get()
      : null;
    if (!canAccessScaleResult(req.user!, r, patient))
      return res
        .status(403)
        .json({ error: "Sem permissao", code: "FORBIDDEN" });
    return res.json(presentScaleResponseRecord(r));
  });

  app.delete(
    "/api/results/:id",
    requireAuth,
    requireProfessional,
    async (req, res) => {
      const ctx = getAuditContextFromRequest(req);
      const result = storage.getResult(oneParam(req.params.id));
      if (!result) return res.status(404).json({ error: "Nao encontrado" });
      const patient = result.patientId
        ? db
            .select()
            .from(patients)
            .where(eq(patients.id, result.patientId))
            .get()
        : null;
      if (!canAccessScaleResult(req.user!, result, patient))
        return res
          .status(403)
          .json({ error: "Sem permissao", code: "FORBIDDEN" });
      const ok = storage.deleteResult(oneParam(req.params.id));
      if (!ok) return res.status(404).json({ error: "Nao encontrado" });
      await logAudit({
        eventType: "result.delete",
        context: ctx,
        targetType: "scale_result",
        targetId: oneParam(req.params.id),
      });
      return res.json({ ok: true });
    },
  );

  app.get("/api/patients/:id/results", requireAuth, (req, res) => {
    const patient = db
      .select()
      .from(patients)
      .where(eq(patients.id, oneParam(req.params.id)))
      .get();
    if (!patient)
      return res.status(404).json({ error: "Paciente nao encontrado" });
    if (!canAccessPatient(req.user!, patient))
      return res
        .status(403)
        .json({ error: "Sem permissao", code: "FORBIDDEN" });
    res.json(
      storage
        .getResultsByPatient(oneParam(req.params.id))
        .map(presentScaleResponseRecord),
    );
  });

  // =========================================================================
  // LGPD — direitos do titular (art. 18)
  // =========================================================================
  app.post("/api/lgpd/export-request", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const parsed = z
      .object({ patientId: z.string().uuid().optional() })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados invalidos", details: parsed.error.errors });
    }
    if (parsed.data.patientId) {
      const patient = db
        .select()
        .from(patients)
        .where(eq(patients.id, parsed.data.patientId))
        .get();
      const decision = patientReferenceDecision(req.user!, patient);
      if (decision === "not_found") {
        return res.status(404).json({ error: "Paciente nao encontrado", code: "NOT_FOUND" });
      }
      if (decision === "forbidden") {
        return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
      }
    }
    const created = db
      .insert(dataRequests)
      .values({
        requesterEmail: req.user!.email,
        requesterName: req.user!.name,
        requestType: "export",
        status: "pending",
        relatedPatientId: parsed.data.patientId,
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
      message:
        "Solicitacao de exportacao registrada. Voce sera notificado em ate 15 dias (LGPD art. 19).",
    });
  });

  app.post("/api/lgpd/delete-request", requireAuth, async (req, res) => {
    const ctx = getAuditContextFromRequest(req);
    const parsed = z
      .object({
        patientId: z.string().uuid().optional(),
        reason: z.string().trim().min(1).max(2_000).optional(),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados invalidos", details: parsed.error.errors });
    }
    if (parsed.data.patientId) {
      const patient = db
        .select()
        .from(patients)
        .where(eq(patients.id, parsed.data.patientId))
        .get();
      const decision = patientReferenceDecision(req.user!, patient);
      if (decision === "not_found") {
        return res.status(404).json({ error: "Paciente nao encontrado", code: "NOT_FOUND" });
      }
      if (decision === "forbidden") {
        return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });
      }
    }
    const created = db
      .insert(dataRequests)
      .values({
        requesterEmail: req.user!.email,
        requesterName: req.user!.name,
        requestType: "delete",
        status: "pending",
        relatedPatientId: parsed.data.patientId,
        notes: parsed.data.reason,
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
      message:
        "Solicitacao de exclusao registrada. Sera processada em ate 15 dias.",
    });
  });

  // =========================================================================
  // EMAIL — envio de relatorio clinico (substitui execSync Perplexity)
  // =========================================================================
  app.post(
    "/api/send-report",
    requireAuth,
    requireProfessional,
    emailRateLimit,
    async (req, res) => {
      const ctx = getAuditContextFromRequest(req);
      const schema = z.object({
        to: z.string().email().optional(),
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(50_000),
        isHtml: z.boolean().default(false),
      });
      try {
        const parsed = schema.parse(req.body);
        const recipient = parsed.to || PROFESSIONAL_REPORT_EMAIL;
        const result = await sendEmail({
          to: recipient,
          subject: parsed.subject,
          text: parsed.isHtml ? undefined : parsed.body,
          html: parsed.isHtml ? parsed.body : undefined,
          replyTo: req.user!.email,
        });
        // Este endpoint deixa qualquer profissional (não só admin) mandar HTML
        // livre para QUALQUER e-mail externo usando o SMTP da clínica — uso
        // indevido pareceria relay de spam/phishing. `redactSensitive` apaga a
        // chave "recipient" de todo log de auditoria (política de minimização
        // de PII), então investigar abuso era impossível mesmo para um admin.
        // Gravamos aqui um traço que não é a chave redigida, mascarado o
        // bastante para não ser o e-mail em si, mas suficiente para apoiar
        // investigação (dominio + iniciais) e correlacionar envios repetidos.
        const [localPart, domainPart] = recipient.split("@");
        const recipientMasked = domainPart
          ? `${localPart.slice(0, 2)}***@${domainPart}`
          : "***";
        await logAudit({
          eventType: "lgpd.access",
          context: ctx,
          metadata: {
            action: "send_report",
            recipientMasked,
            recipientDomain: domainPart ?? "",
            isCustomRecipient: Boolean(parsed.to),
          },
        });
        return res.json({ ok: true, messageId: result.messageId });
      } catch (e: any) {
        if (e instanceof z.ZodError)
          return res
            .status(400)
            .json({ error: "Dados invalidos", details: e.errors });
        console.error("[send-report] error:", e);
        return res.status(500).json({
          error: "Falha ao enviar email",
          detail:
            process.env.NODE_ENV === "development"
              ? e.message
              : "Verifique configuracao SMTP em .env",
        });
      }
    },
  );

  return httpServer;
}
