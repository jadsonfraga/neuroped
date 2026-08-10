/**
 * Rotas de autenticacao:
 *  POST /api/auth/register  â€” cria conta (apenas admin pode em producao)
 *  POST /api/auth/login     â€” emite access + refresh token
 *  POST /api/auth/refresh   â€” rotaciona refresh token e emite novo access
 *  POST /api/auth/logout    â€” revoga refresh token
 *  GET  /api/auth/me        â€” retorna usuario atual
 *  POST /api/auth/change-password â€” troca senha do usuario logado
 */

import type { Express, Request, Response } from "express";
import { eq, and, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  users,
  refreshTokens,
  loginSchema,
  createUserApiSchema,
} from "@shared/schema";
import { db } from "../storage.js";
import { DUMMY_BCRYPT_HASH, PASSWORD_POLICY, hashPassword, verifyPassword, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";
import { signAccessToken, issueRefreshToken, hashRefreshToken } from "../lib/jwt.js";
import { logAudit, getAuditContextFromRequest } from "../lib/audit.js";
import { loginRateLimit } from "../middleware/security.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export function registerAuthRoutes(app: Express): void {
  // ----- Register -----
  app.post("/api/auth/register", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = createUserApiSchema.parse(req.body);
      const existing = db.select().from(users).where(eq(users.email, parsed.email)).get();
      if (existing) {
        return res.status(409).json({ error: "Email ja cadastrado", code: "EMAIL_TAKEN" });
      }

      const passwordHash = await hashPassword(parsed.password);

      const created = db
        .insert(users)
        .values({
          email: parsed.email,
          name: parsed.name,
          passwordHash,
          role: parsed.role,
          crm: parsed.crm,
          rqe: parsed.rqe,
        })
        .returning()
        .get();

      await logAudit({
        eventType: "user.create",
        context: ctx,
        targetType: "user",
        targetId: created.id,
        metadata: { email: created.email, role: created.role },
      });

      return res.status(201).json({
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        createdAt: created.createdAt,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      }
      return res.status(500).json({ error: "Erro interno", code: "INTERNAL_ERROR" });
    }
  });

  // ----- Login -----
  app.post("/api/auth/login", loginRateLimit, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    try {
      const parsed = loginSchema.parse(req.body);
      const user = db.select().from(users).where(eq(users.email, parsed.email)).get();
      const locked = Boolean(user && isAccountLocked(user.lockedUntil));
      const valid = await verifyPassword(parsed.password, user?.passwordHash ?? DUMMY_BCRYPT_HASH);

      if (!user || !user.isActive || locked || !valid) {
        if (user && user.isActive && !locked && !valid) {
          const now = new Date().toISOString();
          const lockUntil = calculateLockoutUntil();
          const updated = db.update(users)
            .set({
              failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,
              lockedUntil: sql`CASE
                WHEN COALESCE(${users.failedLoginAttempts}, 0) + 1 >= ${PASSWORD_POLICY.maxFailedAttempts}
                THEN ${lockUntil}
                ELSE ${users.lockedUntil}
              END`,
            })
            .where(and(
              eq(users.id, user.id),
              eq(users.isActive, true),
              or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),
            ))
            .returning({
              failedLoginAttempts: users.failedLoginAttempts,
              lockedUntil: users.lockedUntil,
            })
            .get();
          if (
            updated &&
            updated.failedLoginAttempts >= PASSWORD_POLICY.maxFailedAttempts &&
            updated.lockedUntil
          ) {
            await logAudit({
              eventType: "auth.account.locked",
              context: ctx,
              targetType: "user",
              targetId: user.id,
              metadata: { attempts: updated.failedLoginAttempts },
              success: false,
            });
          }
        }

        await logAudit({
          eventType: "auth.login.failure",
          context: ctx,
          ...(user ? { targetType: "user", targetId: user.id } : {}),
          metadata: {
            email: parsed.email,
            reason: !user
              ? "user_not_found"
              : !user.isActive
                ? "account_inactive"
                : locked
                  ? "account_locked"
                  : "wrong_password",
          },
          success: false,
        });
        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });
      }

      // Sucesso só é aceito se a conta continuar ativa/desbloqueada depois do
      // bcrypt. Atualização de estado + criação do refresh acontecem na mesma tx.
      const now = new Date().toISOString();
      const refresh = issueRefreshToken();
      const accepted = db.transaction((tx) => {
        const live = tx.update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: now,
          })
          .where(and(
            eq(users.id, user.id),
            eq(users.isActive, true),
            or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),
          ))
          .returning({ id: users.id })
          .get();
        if (!live) return false;
        tx.insert(refreshTokens)
          .values({
            userId: user.id,
            tokenHash: refresh.tokenHash,
            expiresAt: refresh.expiresAt,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          })
          .run();
        return true;
      });
      if (!accepted) {
        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });
      }

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      await logAudit({
        eventType: "auth.login.success",
        context: { ...ctx, userId: user.id },
        targetType: "user",
        targetId: user.id,
      });

      return res.json({
        accessToken,
        refreshToken: refresh.token,
        expiresIn: 15 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      }
      console.error("[auth.login] error:", e);
      return res.status(500).json({ error: "Erro interno", code: "INTERNAL_ERROR" });
    }
  });

  // ----- Refresh -----
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    const refreshTokenInput = z
      .object({ refreshToken: z.string().min(1).max(4_096) })
      .strict();
    try {
      const { refreshToken } = refreshTokenInput.parse(req.body);
      const tokenHash = hashRefreshToken(refreshToken);

      const stored = db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
        .get();

      if (!stored) {
        const reused = db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).get();
        if (reused?.revokedAt) {
          db.update(refreshTokens)
            .set({ revokedAt: new Date().toISOString() })
            .where(and(eq(refreshTokens.userId, reused.userId), isNull(refreshTokens.revokedAt)))
            .run();

          await logAudit({
            eventType: "auth.token.refresh",
            context: { ...ctx, userId: reused.userId },
            targetType: "user",
            targetId: reused.userId,
            metadata: { reason: "refresh_reuse_detected" },
            success: false,
          });
        }
        return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });
      }

      if (new Date(stored.expiresAt).getTime() < Date.now()) {
        return res.status(401).json({ error: "Refresh token expirado", code: "REFRESH_EXPIRED" });
      }

      const newRefresh = issueRefreshToken();
      let rotation: { user: typeof users.$inferSelect } | null = null;
      try {
        rotation = db.transaction((tx) => {
          const current = tx.select().from(refreshTokens)
            .where(and(eq(refreshTokens.id, stored.id), isNull(refreshTokens.revokedAt)))
            .get();
          if (!current || current.tokenHash !== tokenHash || new Date(current.expiresAt).getTime() < Date.now()) {
            throw new Error("REFRESH_RACE");
          }
          const liveUser = tx.select().from(users).where(and(eq(users.id, current.userId), eq(users.isActive, true))).get();
          if (!liveUser) throw new Error("REFRESH_USER_INACTIVE");

          const newRefreshRow = tx
            .insert(refreshTokens)
            .values({
              userId: liveUser.id,
              tokenHash: newRefresh.tokenHash,
              expiresAt: newRefresh.expiresAt,
              ipAddress: ctx.ipAddress,
              userAgent: ctx.userAgent,
            })
            .returning()
            .get();

          const revoked = tx.update(refreshTokens)
            .set({ revokedAt: new Date().toISOString(), rotatedToTokenId: newRefreshRow.id })
            .where(and(eq(refreshTokens.id, current.id), isNull(refreshTokens.revokedAt)))
            .run();
          if (revoked.changes !== 1) throw new Error("REFRESH_RACE");
          return { user: liveUser };
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "REFRESH_USER_INACTIVE") {
          return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });
        }
        if (code === "REFRESH_RACE") {
          db.update(refreshTokens)
            .set({ revokedAt: new Date().toISOString() })
            .where(and(eq(refreshTokens.userId, stored.userId), isNull(refreshTokens.revokedAt)))
            .run();
          await logAudit({
            eventType: "auth.token.refresh",
            context: { ...ctx, userId: stored.userId },
            targetType: "user",
            targetId: stored.userId,
            metadata: { reason: "refresh_race_or_reuse_detected" },
            success: false,
          });
          return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });
        }
        throw error;
      }
      if (!rotation) {
        return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });
      }
      const user = rotation.user;

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      await logAudit({
        eventType: "auth.token.refresh",
        context: { ...ctx, userId: user.id },
        targetType: "user",
        targetId: user.id,
      });

      return res.json({
        accessToken,
        refreshToken: newRefresh.token,
        expiresIn: 15 * 60,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados invalidos", details: e.errors });
      }
      return res.status(500).json({ error: "Erro interno", code: "INTERNAL_ERROR" });
    }
  });

  // ----- Logout -----
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    const schema = z
      .object({ refreshToken: z.string().max(4_096).optional() })
      .strict();
    try {
      const { refreshToken } = schema.parse(req.body || {});
      if (refreshToken) {
        const tokenHash = hashRefreshToken(refreshToken);
        db.update(refreshTokens)
          .set({ revokedAt: new Date().toISOString() })
          .where(eq(refreshTokens.tokenHash, tokenHash))
          .run();
      }
      await logAudit({ eventType: "auth.logout", context: ctx });
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // ----- Me -----
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = db.select().from(users).where(eq(users.id, req.user!.id)).get();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      crm: user.crm,
      rqe: user.rqe,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
    });
  });

  // ----- Verify PIN (bridge PIN â†’ JWT para legado mobile/offline) -----
  app.post("/api/auth/verify-pin", loginRateLimit, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    await logAudit({
      eventType: "auth.pin.failure",
      context: ctx,
      metadata: { reason: "pin_bridge_disabled" },
      success: false,
    });
    return res.status(410).json({
      error: "Acesso por PIN desativado. Use login nominal com email e senha.",
      code: "PIN_DISABLED",
    });
  });

  // ----- Change password -----
  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    const ctx = getAuditContextFromRequest(req);
    const schema = z.object({
      currentPassword: z.string().min(1).max(256),
      newPassword: z
        .string()
        .min(12)
        .max(128)
        .regex(/[A-Z]/)
        .regex(/[a-z]/)
        .regex(/[0-9]/)
        .regex(/[^A-Za-z0-9]/),
    }).strict();
    try {
      const { currentPassword, newPassword } = schema.parse(req.body);
      const user = db.select().from(users).where(eq(users.id, req.user!.id)).get();
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Senha atual incorreta", code: "WRONG_PASSWORD" });
      }

      const newHash = await hashPassword(newPassword);
      db.update(users)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id))
        .run();

      // Revoga todas as sessoes ativas
      db.update(refreshTokens)
        .set({ revokedAt: new Date().toISOString() })
        .where(and(eq(refreshTokens.userId, user.id), isNull(refreshTokens.revokedAt)))
        .run();

      await logAudit({
        eventType: "auth.password.change",
        context: { ...ctx, userId: user.id },
        targetType: "user",
        targetId: user.id,
      });

      return res.json({ ok: true, message: "Senha alterada. Faca login novamente." });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({
          error: "Senha nova nao atende aos requisitos",
          details: e.errors,
        });
      }
      return res.status(500).json({ error: "Erro interno" });
    }
  });
}
