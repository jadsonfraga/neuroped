import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  scaleResults,
  scaleShareSessions,
  type ScaleShareSession,
} from "@shared/schema";
import { db } from "../storage.js";
import { requireAuth, requireProfessional } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { generateRandomToken, sha256 } from "../lib/crypto.js";
import { getAuditContextFromRequest, logAudit } from "../lib/audit.js";
import {
  canAccessPatient,
  patientReferenceDecision,
} from "../lib/ownership.js";
import { patients } from "@shared/schema";

const MAX_SHARED_SCALES = 8;
const MAX_RESPONSE_ITEMS = 2_000;
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

const scaleSelectionSchema = z.object({
  id: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1).max(300),
  fullName: z.string().trim().max(500).optional(),
});

const createShareSchema = z
  .object({
    patientId: z.string().trim().min(1).max(128),
    scales: z.array(scaleSelectionSchema).min(1).max(MAX_SHARED_SCALES),
  })
  .strict();

const responseItemSchema = z.object({
  question: z.string().trim().min(1).max(8_000),
  answer: z.string().trim().max(32_000).optional().nullable(),
});

const submitShareSchema = z
  .object({
    token: z.string().trim().min(20).max(256),
    respondentName: z.string().trim().max(160).optional().nullable(),
    results: z
      .array(
        z.object({
          scaleId: z.string().trim().min(1).max(128),
          patientAge: z.string().trim().max(80).optional().nullable(),
          responses: z.array(responseItemSchema).min(1).max(MAX_RESPONSE_ITEMS),
        }),
      )
      .min(1)
      .max(MAX_SHARED_SCALES),
  })
  .strict();

type ShareScale = z.infer<typeof scaleSelectionSchema>;
type ShareSubmission = z.infer<typeof submitShareSchema>;

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizedScales(scales: ShareScale[]): ShareScale[] {
  const seen = new Set<string>();
  return scales.filter((scale) => {
    if (seen.has(scale.id)) return false;
    seen.add(scale.id);
    return true;
  });
}

function presentShare(share: ScaleShareSession) {
  return {
    shareId: share.id,
    status: share.status,
    scales: parseJson<ShareScale[]>(share.selectedScales, []),
    expiresAt: share.expiresAt,
    submittedAt: share.submittedAt,
  };
}

function getShareByToken(token: string): ScaleShareSession | undefined {
  return db
    .select()
    .from(scaleShareSessions)
    .where(eq(scaleShareSessions.tokenHash, sha256(token)))
    .get();
}

function rejectExpiredOrClosed(
  share: ScaleShareSession,
  res: Response,
): boolean {
  if (share.status === "submitted") {
    res.status(409).json({
      error: "Este link já foi respondido.",
      code: "SHARE_ALREADY_SUBMITTED",
      submittedAt: share.submittedAt,
    });
    return true;
  }
  if (share.status !== "pending" || Date.parse(share.expiresAt) <= Date.now()) {
    res.status(410).json({
      error:
        "Este link expirou ou foi revogado. Solicite um novo link ao consultório.",
      code: "SHARE_EXPIRED",
    });
    return true;
  }
  return false;
}

function validateSubmission(
  share: ScaleShareSession,
  submission: ShareSubmission,
): {
  scales: ShareScale[];
  resultsById: Map<string, ShareSubmission["results"][number]>;
} | null {
  const scales = normalizedScales(
    parseJson<ShareScale[]>(share.selectedScales, []),
  );
  const resultsById = new Map<string, ShareSubmission["results"][number]>();
  for (const result of submission.results) {
    if (resultsById.has(result.scaleId)) return null;
    resultsById.set(result.scaleId, result);
  }
  if (scales.length === 0 || scales.length !== resultsById.size) return null;
  if (scales.some((scale) => !resultsById.has(scale.id))) return null;
  return { scales, resultsById };
}

export function registerScaleShareRoutes(app: Express): void {
  app.post(
    "/api/scale-shares",
    requireAuth,
    requireProfessional,
    writeRateLimit,
    async (req: Request, res: Response) => {
      const ctx = getAuditContextFromRequest(req);
      const parsed = createShareSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Informe um paciente e ao menos uma escala válida.",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        });
      }

      const scales = normalizedScales(parsed.data.scales);
      if (scales.length === 0 || scales.length > MAX_SHARED_SCALES) {
        return res.status(400).json({
          error: `Selecione entre 1 e ${MAX_SHARED_SCALES} escalas diferentes.`,
          code: "VALIDATION_ERROR",
        });
      }

      const user = (req as any).user as { id: string; role: string };
      const patient = db
        .select()
        .from(patients)
        .where(eq(patients.id, parsed.data.patientId))
        .get();
      const decision = patientReferenceDecision(user, patient);
      if (decision === "not_found") {
        return res
          .status(404)
          .json({ error: "Paciente não encontrado.", code: "NOT_FOUND" });
      }
      if (
        decision === "forbidden" ||
        !patient ||
        !canAccessPatient(user, patient)
      ) {
        return res
          .status(403)
          .json({
            error: "Sem permissão para este paciente.",
            code: "FORBIDDEN",
          });
      }

      const token = generateRandomToken(32);
      const now = new Date();
      const share = db
        .insert(scaleShareSessions)
        .values({
          patientId: patient.id,
          createdByUserId: user.id,
          tokenHash: sha256(token),
          selectedScales: JSON.stringify(scales),
          status: "pending",
          expiresAt: new Date(now.getTime() + SHARE_TTL_MS).toISOString(),
          createdAt: now.toISOString(),
        })
        .returning()
        .get();

      await logAudit({
        eventType: "share.create",
        context: ctx,
        targetType: "scale_share_session",
        targetId: share.id,
        metadata: {
          patientId: share.patientId,
          scaleCount: scales.length,
          scaleIds: scales.map((scale) => scale.id),
          expiresAt: share.expiresAt,
        },
      });

      return res.status(201).json({
        ...presentShare(share),
        token,
      });
    },
  );

  app.post(
    "/api/scale-shares/open",
    writeRateLimit,
    (req: Request, res: Response) => {
      const token =
        typeof req.body?.token === "string" ? req.body.token.trim() : "";
      if (!token || token.length < 20 || token.length > 256) {
        return res
          .status(400)
          .json({ error: "Link inválido.", code: "VALIDATION_ERROR" });
      }
      const share = getShareByToken(token);
      if (!share)
        return res
          .status(404)
          .json({ error: "Link não encontrado.", code: "NOT_FOUND" });
      if (rejectExpiredOrClosed(share, res)) return;
      return res.json(presentShare(share));
    },
  );

  app.post(
    "/api/scale-shares/submit",
    writeRateLimit,
    async (req: Request, res: Response) => {
      const ctx = getAuditContextFromRequest(req);
      const parsed = submitShareSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Revise as respostas antes de enviar.",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        });
      }

      const share = getShareByToken(parsed.data.token);
      if (!share)
        return res
          .status(404)
          .json({ error: "Link não encontrado.", code: "NOT_FOUND" });
      if (rejectExpiredOrClosed(share, res)) return;
      const validated = validateSubmission(share, parsed.data);
      if (!validated) {
        return res.status(400).json({
          error:
            "O conjunto de respostas não corresponde às escalas deste link.",
          code: "SCALES_MISMATCH",
        });
      }

      const submittedAt = new Date().toISOString();
      const respondentName = parsed.data.respondentName?.trim() || null;
      const resultIds = validated.scales.map(() => crypto.randomUUID());

      try {
        db.transaction((tx) => {
          const claimed = tx
            .update(scaleShareSessions)
            .set({
              status: "submitted",
              submittedAt,
              respondentName,
              resultIds: JSON.stringify(resultIds),
            })
            .where(
              and(
                eq(scaleShareSessions.id, share.id),
                eq(scaleShareSessions.status, "pending"),
              ),
            )
            .run();
          if (claimed.changes !== 1) {
            const conflict = new Error("SHARE_ALREADY_SUBMITTED");
            conflict.name = "SHARE_ALREADY_SUBMITTED";
            throw conflict;
          }

          validated.scales.forEach((scale, index) => {
            const result = validated.resultsById.get(scale.id)!;
            const responses = result.responses.map((item) => ({
              question: item.question.trim(),
              answer: item.answer?.trim() || "Não respondida",
            }));
            tx.insert(scaleResults)
              .values({
                id: resultIds[index],
                patientId: share.patientId,
                appliedByUserId: share.createdByUserId,
                scaleName: scale.name,
                scaleVersion: "family-link-v1",
                answers: JSON.stringify(responses),
                answersEncrypted: null,
                totalScore: 0,
                classification: "Respostas recebidas da família",
                patientAge: result.patientAge?.trim() || null,
                domainScores: null,
                notes: "Origem: link remoto preenchido por responsável.",
                createdAt: submittedAt,
              })
              .run();
          });
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "SHARE_ALREADY_SUBMITTED"
        ) {
          return res.status(409).json({
            error: "Este link já foi respondido.",
            code: "SHARE_ALREADY_SUBMITTED",
          });
        }
        console.error("[scale-shares.submit]", error);
        return res.status(500).json({
          error: "Não foi possível guardar as respostas. Tente novamente.",
          code: "PERSISTENCE_FAILED",
        });
      }

      await logAudit({
        eventType: "share.submit",
        context: ctx,
        targetType: "scale_share_session",
        targetId: share.id,
        metadata: {
          scaleCount: validated.scales.length,
          resultCount: resultIds.length,
          respondentProvided: Boolean(respondentName),
        },
      });

      return res.status(201).json({
        status: "submitted",
        submittedAt,
        resultIds,
      });
    },
  );
}
