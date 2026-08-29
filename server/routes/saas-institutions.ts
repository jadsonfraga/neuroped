/**
 * API de Instituições — B2B Multi-Clinic Management
 *
 * Endpoints:
 * POST   /api/saas/institutions
 * GET    /api/saas/institutions
 * GET    /api/saas/institutions/:institutionId
 * PATCH  /api/saas/institutions/:institutionId
 * POST   /api/saas/institutions/:institutionId/clinics
 * GET    /api/saas/institutions/:institutionId/clinics
 * POST   /api/saas/institutions/:institutionId/users
 * GET    /api/saas/institutions/:institutionId/users
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../storage.js";
import {
  institutions,
  institutionClinicAssignments,
  institutionUsers,
  createInstitutionSchema,
} from "@shared/saas-schema-extended";
import { requireAuth } from "../middleware/auth.js";
import {
  logAuthorizationAttempt,
  type AuthorizationContext,
} from "../middleware/saas-authorization.js";
import { oneParam } from "../lib/http.js";

/** Papéis da instituição em ordem crescente de poder. */
const institutionRoleRank: Record<string, number> = {
  viewer: 1,
  operator: 2,
  manager: 3,
  admin: 4,
};

/**
 * Resolve o vínculo do usuário com a instituição. O criador (adminUserId) é
 * sempre admin; os demais precisam de uma linha em institution_users.
 * Retorna null quando não há vínculo — o chamador nega (fail closed).
 */
function resolveInstitutionAccess(
  institutionId: string,
  userId: string,
): { institution: typeof institutions.$inferSelect; role: string } | null {
  const institution = db
    .select()
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .get();

  if (!institution) return null;
  if (institution.adminUserId === userId) return { institution, role: "admin" };

  const membership = db
    .select()
    .from(institutionUsers)
    .where(
      and(
        eq(institutionUsers.institutionId, institutionId),
        eq(institutionUsers.userId, userId),
      ),
    )
    .get();

  if (!membership) return null;
  return { institution, role: membership.role };
}

function roleAtLeast(role: string, required: keyof typeof institutionRoleRank): boolean {
  return (institutionRoleRank[role] ?? 0) >= institutionRoleRank[required];
}

/**
 * Nega o pedido de forma uniforme quando não há vínculo ou o papel é fraco.
 * Responde 404 para ausência de vínculo: quem não participa da instituição não
 * deve conseguir distinguir "não existe" de "existe e você não tem acesso".
 */
function denyInstitution(
  res: Response,
  authContext: AuthorizationContext | undefined,
  action: string,
  institutionId: string,
  reason: string,
  status: 403 | 404,
) {
  if (authContext) {
    logAuthorizationAttempt(authContext, action, `institution:${institutionId}`, "denied", reason);
  }
  return status === 404
    ? res.status(404).json({ error: "Institution not found" })
    : res.status(403).json({ error: "Insufficient institution role" });
}

const assignClinicSchema = z
  .object({
    clinicId: z.string().min(1).max(255),
    role: z.enum(["primary", "secondary", "satellite"]).optional(),
  })
  .strict();

const assignUserSchema = z
  .object({
    userId: z.string().min(1).max(255),
    role: z.enum(["admin", "manager", "operator", "viewer"]),
  })
  .strict();

/**
 * POST /api/saas/institutions
 * Cria nova instituição (only admins)
 */
function handleCreateInstitution(req: Request, res: Response) {
  try {
    const body = req.body;
    const input = createInstitutionSchema.parse(body);
    const user = req.user;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      if (authContext) {
        logAuthorizationAttempt(authContext, "create_institution", undefined, "denied", "unauthorized");
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Criação é self-service: qualquer usuário autenticado pode registrar uma
    // instituição e se torna admin apenas dela. Nenhum acesso a instituições de
    // terceiros decorre disso — leitura e escrita passam por
    // resolveInstitutionAccess.

    const now = new Date().toISOString();
    const institutionId = `inst_${crypto.randomUUID()}`;

    db.insert(institutions).values({
      id: institutionId,
      name: input.name,
      legalName: input.legalName,
      cnpj: input.cnpj,
      country: input.country,
      city: input.city,
      state: input.state,
      website: input.website,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      adminUserId: user.id,
      createdAt: now,
      updatedAt: now,
    }).run();

    if (authContext) {
      logAuthorizationAttempt(authContext, "create_institution", `institution:${institutionId}`, "allowed");
    }

    return res.status(201).json({
      success: true,
      institution: {
        id: institutionId,
        name: input.name,
        legalName: input.legalName,
        cnpj: input.cnpj,
        adminUserId: user.id,
        isActive: true,
        clinicCount: 0,
        createdAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error creating institution:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/institutions
 * Lista instituições (filtered by user permissions)
 */
function handleListInstitutions(req: Request, res: Response) {
  try {
    const user = req.user;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Somente instituições em que o usuário participa: como criador
    // (adminUserId) ou por linha em institution_users.
    const memberships = db
      .select({ institutionId: institutionUsers.institutionId })
      .from(institutionUsers)
      .where(eq(institutionUsers.userId, user.id))
      .all();
    const memberOf = new Set(memberships.map((m) => m.institutionId));

    const list = db
      .select()
      .from(institutions)
      .where(eq(institutions.isActive, true))
      .all()
      .filter((i) => i.adminUserId === user.id || memberOf.has(i.id));

    if (authContext) {
      logAuthorizationAttempt(authContext, "list_institutions", undefined, "allowed");
    }

    return res.json({
      total: list.length,
      institutions: list,
    });
  } catch (error) {
    console.error("Error listing institutions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/institutions/:institutionId
 * Retorna detalhes de uma instituição
 */
function handleGetInstitution(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const authContext = (req as any).authContext as AuthorizationContext;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const access = resolveInstitutionAccess(institutionId, user.id);
    if (!access) {
      return denyInstitution(res, authContext, "get_institution", institutionId, "no_membership", 404);
    }
    const { institution } = access;

    // Get associated clinics
    const clinics = db
      .select()
      .from(institutionClinicAssignments)
      .where(eq(institutionClinicAssignments.institutionId, institutionId))
      .all();

    if (authContext) {
      logAuthorizationAttempt(authContext, "get_institution", `institution:${institutionId}`, "allowed");
    }

    return res.json({
      ...institution,
      clinics: clinics.length,
      clinicAssignments: clinics,
    });
  } catch (error) {
    console.error("Error fetching institution:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/saas/institutions/:institutionId
 * Atualiza instituição
 */
function handleUpdateInstitution(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const user = req.user;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const access = resolveInstitutionAccess(institutionId, user.id);
    if (!access) {
      return denyInstitution(res, authContext, "update_institution", institutionId, "no_membership", 404);
    }
    if (!roleAtLeast(access.role, "manager")) {
      return denyInstitution(res, authContext, "update_institution", institutionId, "insufficient_role", 403);
    }

    const { name, legalName, city, state, website, contactEmail, contactPhone, isActive } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (name) updates.name = name;
    if (legalName) updates.legalName = legalName;
    if (city) updates.city = city;
    if (state) updates.state = state;
    if (website) updates.website = website;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (contactPhone) updates.contactPhone = contactPhone;
    if (isActive !== undefined) updates.isActive = isActive;

    db.update(institutions)
      .set(updates)
      .where(eq(institutions.id, institutionId))
      .run();

    if (authContext) {
      logAuthorizationAttempt(authContext, "update_institution", `institution:${institutionId}`, "allowed");
    }

    const updated = db
      .select()
      .from(institutions)
      .where(eq(institutions.id, institutionId))
      .get();

    return res.json({ success: true, institution: updated });
  } catch (error) {
    console.error("Error updating institution:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/saas/institutions/:institutionId/clinics
 * Associa clínica à instituição
 */
function handleAssignClinicToInstitution(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const body = req.body;
    const input = assignClinicSchema.parse(body);
    const user = req.user;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const access = resolveInstitutionAccess(institutionId, user.id);
    if (!access) {
      return denyInstitution(res, authContext, "assign_clinic", institutionId, "no_membership", 404);
    }
    if (!roleAtLeast(access.role, "manager")) {
      return denyInstitution(res, authContext, "assign_clinic", institutionId, "insufficient_role", 403);
    }
    const { institution } = access;

    // Check if clinic already assigned
    const existing = db
      .select()
      .from(institutionClinicAssignments)
      .where(eq(institutionClinicAssignments.clinicId, input.clinicId))
      .get();

    if (existing) {
      if (authContext) {
        logAuthorizationAttempt(authContext, "assign_clinic", `clinic:${input.clinicId}`, "denied", "already_assigned");
      }
      return res.status(409).json({ error: "Clinic already assigned to institution" });
    }

    const now = new Date().toISOString();
    const assignmentId = `ica_${crypto.randomUUID()}`;

    db.insert(institutionClinicAssignments).values({
      id: assignmentId,
      institutionId,
      clinicId: input.clinicId,
      role: input.role || "primary",
      assignedAt: now,
      assignedBy: user.id,
      createdAt: now,
    }).run();

    // Update clinic count
    db.update(institutions)
      .set({
        clinicCount: (institution.clinicCount || 0) + 1,
        updatedAt: now,
      })
      .where(eq(institutions.id, institutionId))
      .run();

    if (authContext) {
      logAuthorizationAttempt(authContext, "assign_clinic", `clinic:${input.clinicId}`, "allowed");
    }

    return res.status(201).json({
      success: true,
      assignment: {
        id: assignmentId,
        institutionId,
        clinicId: input.clinicId,
        role: input.role || "primary",
        assignedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error assigning clinic:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/institutions/:institutionId/clinics
 * Lista clínicas associadas
 */
function handleListInstitutionClinics(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const authContext = (req as any).authContext as AuthorizationContext;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!resolveInstitutionAccess(institutionId, user.id)) {
      return denyInstitution(res, authContext, "list_clinics", institutionId, "no_membership", 404);
    }

    const clinics = db
      .select()
      .from(institutionClinicAssignments)
      .where(eq(institutionClinicAssignments.institutionId, institutionId))
      .all();

    if (authContext) {
      logAuthorizationAttempt(authContext, "list_clinics", `institution:${institutionId}`, "allowed");
    }

    return res.json({
      institutionId,
      total: clinics.length,
      clinics,
    });
  } catch (error) {
    console.error("Error listing institution clinics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/saas/institutions/:institutionId/users
 * Adiciona usuário à instituição
 */
function handleAssignUserToInstitution(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const body = req.body;
    const input = assignUserSchema.parse(body);
    const user = req.user;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const access = resolveInstitutionAccess(institutionId, user.id);
    if (!access) {
      return denyInstitution(res, authContext, "assign_user", institutionId, "no_membership", 404);
    }
    // Conceder papéis é privilégio de admin: um manager não pode se promover
    // nem criar outro admin.
    if (!roleAtLeast(access.role, "admin")) {
      return denyInstitution(res, authContext, "assign_user", institutionId, "insufficient_role", 403);
    }

    // Check if user already has role
    const existing = db
      .select()
      .from(institutionUsers)
      .where(
        and(
          eq(institutionUsers.institutionId, institutionId),
          eq(institutionUsers.userId, input.userId),
        ),
      )
      .get();

    if (existing) {
      if (authContext) {
        logAuthorizationAttempt(authContext, "assign_user", `institution:${institutionId}`, "denied", "already_assigned");
      }
      return res.status(409).json({ error: "User already assigned to institution" });
    }

    const now = new Date().toISOString();
    const assignmentId = `iu_${crypto.randomUUID()}`;

    db.insert(institutionUsers).values({
      id: assignmentId,
      institutionId,
      userId: input.userId,
      role: input.role,
      grantedAt: now,
      grantedBy: user.id,
      createdAt: now,
    }).run();

    if (authContext) {
      logAuthorizationAttempt(authContext, "assign_user", `institution:${institutionId}`, "allowed");
    }

    return res.status(201).json({
      success: true,
      assignment: {
        id: assignmentId,
        institutionId,
        userId: input.userId,
        role: input.role,
        grantedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error assigning user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/institutions/:institutionId/users
 * Lista usuários da instituição
 */
function handleListInstitutionUsers(req: Request, res: Response) {
  try {
    const institutionId = oneParam(req.params.institutionId);
    const authContext = (req as any).authContext as AuthorizationContext;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });
    // A lista de membros expõe quem tem acesso: exige manager+.
    const access = resolveInstitutionAccess(institutionId, user.id);
    if (!access) {
      return denyInstitution(res, authContext, "list_users", institutionId, "no_membership", 404);
    }
    if (!roleAtLeast(access.role, "manager")) {
      return denyInstitution(res, authContext, "list_users", institutionId, "insufficient_role", 403);
    }

    const users = db
      .select()
      .from(institutionUsers)
      .where(eq(institutionUsers.institutionId, institutionId))
      .all();

    if (authContext) {
      logAuthorizationAttempt(authContext, "list_users", `institution:${institutionId}`, "allowed");
    }

    return res.json({
      institutionId,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error listing institution users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Registra rotas de instituições
 */
export function registerInstitutionRoutes(app: Express) {
  app.post("/api/saas/institutions", requireAuth, handleCreateInstitution);
  app.get("/api/saas/institutions", requireAuth, handleListInstitutions);
  app.get("/api/saas/institutions/:institutionId", requireAuth, handleGetInstitution);
  app.patch("/api/saas/institutions/:institutionId", requireAuth, handleUpdateInstitution);
  app.post("/api/saas/institutions/:institutionId/clinics", requireAuth, handleAssignClinicToInstitution);
  app.get("/api/saas/institutions/:institutionId/clinics", requireAuth, handleListInstitutionClinics);
  app.post("/api/saas/institutions/:institutionId/users", requireAuth, handleAssignUserToInstitution);
  app.get("/api/saas/institutions/:institutionId/users", requireAuth, handleListInstitutionUsers);
}
