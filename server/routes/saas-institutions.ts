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

import type { Express } from "express";
import { z } from "zod";
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
function handleCreateInstitution(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const body = req.body;
    const input = createInstitutionSchema.parse(body);
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      logAuthorizationAttempt(authContext, "create_institution", undefined, "denied", "unauthorized");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Validate user is admin
    // if (!user.isAdmin) {
    //   return res.status(403).json({ error: "Admin access required" });
    // }

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
    } as any);

    logAuthorizationAttempt(authContext, "create_institution", `institution:${institutionId}`, "allowed");

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
function handleListInstitutions(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Filter by user's institution assignments
    // For now, return all active institutions (admin view)
    const list = db
      .select()
      .from(institutions)
      .where((i: any) => i.isActive.eq(true))
      .all();

    logAuthorizationAttempt(authContext, "list_institutions", undefined, "allowed");

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
function handleGetInstitution(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const authContext = (req as any).authContext as AuthorizationContext;

    const institution = db
      .select()
      .from(institutions)
      .where((i: any) => i.id.eq(institutionId))
      .first();

    if (!institution) {
      logAuthorizationAttempt(authContext, "get_institution", `institution:${institutionId}`, "denied", "not_found");
      return res.status(404).json({ error: "Institution not found" });
    }

    // Get associated clinics
    const clinics = db
      .select()
      .from(institutionClinicAssignments)
      .where((a: any) => a.institutionId.eq(institutionId))
      .all();

    logAuthorizationAttempt(authContext, "get_institution", `institution:${institutionId}`, "allowed");

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
function handleUpdateInstitution(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const institution = db
      .select()
      .from(institutions)
      .where((i: any) => i.id.eq(institutionId))
      .first();

    if (!institution) {
      logAuthorizationAttempt(authContext, "update_institution", `institution:${institutionId}`, "denied", "not_found");
      return res.status(404).json({ error: "Institution not found" });
    }

    // TODO: Validate user is admin or manager of institution
    // if (institution.adminUserId !== user.id && !user.isAdmin) {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

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
      .set(updates as any)
      .where((i: any) => i.id.eq(institutionId))
      .run();

    logAuthorizationAttempt(authContext, "update_institution", `institution:${institutionId}`, "allowed");

    const updated = db
      .select()
      .from(institutions)
      .where((i: any) => i.id.eq(institutionId))
      .first();

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
function handleAssignClinicToInstitution(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const body = req.body;
    const input = assignClinicSchema.parse(body);
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const institution = db
      .select()
      .from(institutions)
      .where((i: any) => i.id.eq(institutionId))
      .first();

    if (!institution) {
      logAuthorizationAttempt(authContext, "assign_clinic", `institution:${institutionId}`, "denied", "not_found");
      return res.status(404).json({ error: "Institution not found" });
    }

    // Check if clinic already assigned
    const existing = db
      .select()
      .from(institutionClinicAssignments)
      .where((a: any) => a.clinicId.eq(input.clinicId))
      .first();

    if (existing) {
      logAuthorizationAttempt(authContext, "assign_clinic", `clinic:${input.clinicId}`, "denied", "already_assigned");
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
    } as any);

    // Update clinic count
    db.update(institutions)
      .set({
        clinicCount: (institution.clinicCount || 0) + 1,
        updatedAt: now,
      } as any)
      .where((i: any) => i.id.eq(institutionId))
      .run();

    logAuthorizationAttempt(authContext, "assign_clinic", `clinic:${input.clinicId}`, "allowed");

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
function handleListInstitutionClinics(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const authContext = (req as any).authContext as AuthorizationContext;

    const clinics = db
      .select()
      .from(institutionClinicAssignments)
      .where((a: any) => a.institutionId.eq(institutionId))
      .all();

    logAuthorizationAttempt(authContext, "list_clinics", `institution:${institutionId}`, "allowed");

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
function handleAssignUserToInstitution(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const body = req.body;
    const input = assignUserSchema.parse(body);
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const institution = db
      .select()
      .from(institutions)
      .where((i: any) => i.id.eq(institutionId))
      .first();

    if (!institution) {
      logAuthorizationAttempt(authContext, "assign_user", `institution:${institutionId}`, "denied", "not_found");
      return res.status(404).json({ error: "Institution not found" });
    }

    // Check if user already has role
    const existing = db
      .select()
      .from(institutionUsers)
      .where((iu: any) => iu.institutionId.eq(institutionId) && iu.userId.eq(input.userId))
      .first();

    if (existing) {
      logAuthorizationAttempt(authContext, "assign_user", `institution:${institutionId}`, "denied", "already_assigned");
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
    } as any);

    logAuthorizationAttempt(authContext, "assign_user", `institution:${institutionId}`, "allowed");

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
function handleListInstitutionUsers(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const institutionId = req.params.institutionId;
    const authContext = (req as any).authContext as AuthorizationContext;

    const users = db
      .select()
      .from(institutionUsers)
      .where((iu: any) => iu.institutionId.eq(institutionId))
      .all();

    logAuthorizationAttempt(authContext, "list_users", `institution:${institutionId}`, "allowed");

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
