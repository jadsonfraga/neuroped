/**
 * API de Templates de Disponibilidade — Gestão de horários reutilizáveis
 *
 * Endpoints:
 * POST   /api/saas/templates/availability
 * GET    /api/saas/templates/availability
 * GET    /api/saas/templates/availability/:templateId
 * PATCH  /api/saas/templates/availability/:templateId
 * DELETE /api/saas/templates/availability/:templateId
 * POST   /api/saas/templates/availability/:templateId/apply
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../storage.js";
import {
  availabilityTemplates,
  professionalTemplateAssignments,
  createAvailabilityTemplateApiSchema,
  applyTemplateSchema,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";
import {
  validateClinicOwnership,
  requireClinicManager,
} from "../middleware/saas-authorization.js";
import { oneParam } from "../lib/http.js";

/**
 * POST /api/saas/templates/availability
 * Cria um novo template de disponibilidade
 */
function handleCreateTemplate(req: Request, res: Response) {
  try {
    const body = req.body;
    const input = createAvailabilityTemplateApiSchema.parse(body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const clinicId = (req as any).clinicId as string;

    const now = new Date().toISOString();

    // Validar nome único por clínica
    const existing = db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.clinicId, clinicId),
          eq(availabilityTemplates.name, input.name),
        ),
      )
      .get();

    if (existing) {
      return res.status(409).json({
        error: `Template "${input.name}" already exists for this clinic`,
      });
    }

    const templateId = `tpl_${crypto.randomUUID()}`;
    const rulesJson = JSON.stringify(input.rules);

    db.insert(availabilityTemplates).values({
      id: templateId,
      clinicId,
      name: input.name,
      description: input.description,
      rules: rulesJson,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    }).run();

    return res.status(201).json({
      success: true,
      template: {
        id: templateId,
        clinicId,
        name: input.name,
        description: input.description,
        rules: input.rules,
        isActive: true,
        usageCount: 0,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error creating template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/templates/availability
 * Lista templates da clínica
 */
function handleListTemplates(req: Request, res: Response) {
  try {
    const clinicId = (req as any).clinicId as string;

    const isActive = req.query.isActive as string;

    const conditions = [eq(availabilityTemplates.clinicId, clinicId)];
    if (isActive === "true" || isActive === "false") {
      conditions.push(eq(availabilityTemplates.isActive, isActive === "true"));
    }

    const templates = db
      .select()
      .from(availabilityTemplates)
      .where(and(...conditions))
      .all();

    const parsed = templates.map((t) => ({
      ...t,
      rules: JSON.parse(t.rules),
    }));

    return res.json({
      clinicId,
      total: parsed.length,
      templates: parsed,
    });
  } catch (error) {
    console.error("Error listing templates:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/templates/availability/:templateId
 * Retorna detalhes de um template
 */
function handleGetTemplate(req: Request, res: Response) {
  try {
    const templateId = oneParam(req.params.templateId);
    const clinicId = (req as any).clinicId as string;

    const template = db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.id, templateId),
          eq(availabilityTemplates.clinicId, clinicId),
        ),
      )
      .get();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json({
      ...template,
      rules: JSON.parse(template.rules),
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/saas/templates/availability/:templateId
 * Atualiza template de disponibilidade
 */
function handleUpdateTemplate(req: Request, res: Response) {
  try {
    const templateId = oneParam(req.params.templateId);
    const clinicId = (req as any).clinicId as string;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const template = db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.id, templateId),
          eq(availabilityTemplates.clinicId, clinicId),
        ),
      )
      .get();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const { name, description, rules, isActive } = req.body;
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      // Validar nome único
      if (name !== template.name) {
        const existing = db
          .select()
          .from(availabilityTemplates)
          .where(
            and(
              eq(availabilityTemplates.clinicId, clinicId),
              eq(availabilityTemplates.name, name),
            ),
          )
          .get();
        if (existing) {
          return res.status(409).json({
            error: `Template "${name}" already exists for this clinic`,
          });
        }
      }
      updates.name = name;
    }

    if (description !== undefined) updates.description = description;
    if (rules !== undefined) updates.rules = JSON.stringify(rules);
    if (isActive !== undefined) updates.isActive = isActive;

    db.update(availabilityTemplates)
      .set(updates)
      .where(eq(availabilityTemplates.id, templateId))
      .run();

    const updated = db
      .select()
      .from(availabilityTemplates)
      .where(eq(availabilityTemplates.id, templateId))
      .get();

    return res.json({
      success: true,
      template: {
        ...updated,
        rules: JSON.parse(updated!.rules),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error updating template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/saas/templates/availability/:templateId
 * Deleta um template (soft delete via isActive)
 */
function handleDeleteTemplate(req: Request, res: Response) {
  try {
    const templateId = oneParam(req.params.templateId);
    const clinicId = (req as any).clinicId as string;

    const template = db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.id, templateId),
          eq(availabilityTemplates.clinicId, clinicId),
        ),
      )
      .get();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Soft delete: marcar como inativo
    db.update(availabilityTemplates)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(availabilityTemplates.id, templateId))
      .run();

    return res.json({
      success: true,
      message: "Template deleted successfully",
      templateId,
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/saas/templates/availability/:templateId/apply
 * Aplica template a um profissional
 */
function handleApplyTemplate(req: Request, res: Response) {
  try {
    const templateId = oneParam(req.params.templateId);
    const clinicId = (req as any).clinicId as string;
    const body = req.body;
    const input = applyTemplateSchema.parse(body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Validar que templateId pertence à clínica
    // TODO: Validar que professionalId pertence à clínica

    const template = db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.id, templateId),
          eq(availabilityTemplates.clinicId, clinicId),
        ),
      )
      .get();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Verificar se já existe assignment
    const existingAssignment = db
      .select()
      .from(professionalTemplateAssignments)
      .where(
        and(
          eq(professionalTemplateAssignments.professionalId, input.appliedBy),
          eq(professionalTemplateAssignments.templateId, templateId),
        ),
      )
      .get();

    if (existingAssignment) {
      return res.status(409).json({
        error: "Template already applied to this professional",
      });
    }

    const now = new Date().toISOString();
    const assignmentId = `pta_${crypto.randomUUID()}`;

    db.insert(professionalTemplateAssignments).values({
      id: assignmentId,
      professionalId: input.appliedBy,
      templateId,
      clinicId,
      appliedAt: now,
      appliedBy: user.id,
      createdAt: now,
    }).run();

    // Incrementar usage count
    db.update(availabilityTemplates)
      .set({
        usageCount: (template.usageCount || 0) + 1,
        updatedAt: now,
      })
      .where(eq(availabilityTemplates.id, templateId))
      .run();

    return res.status(201).json({
      success: true,
      assignment: {
        id: assignmentId,
        professionalId: input.appliedBy,
        templateId,
        clinicId,
        appliedAt: now,
        appliedBy: user.id,
        createdAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error applying template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Registra rotas de templates de disponibilidade
 */
export function registerAvailabilityTemplateRoutes(app: Express) {
  app.post(
    "/api/saas/templates/availability",
    requireAuth,
    validateClinicOwnership,
    requireClinicManager,
    handleCreateTemplate,
  );
  app.get(
    "/api/saas/templates/availability",
    requireAuth,
    validateClinicOwnership,
    handleListTemplates,
  );
  app.get(
    "/api/saas/templates/availability/:templateId",
    requireAuth,
    validateClinicOwnership,
    handleGetTemplate,
  );
  app.patch(
    "/api/saas/templates/availability/:templateId",
    requireAuth,
    validateClinicOwnership,
    requireClinicManager,
    handleUpdateTemplate,
  );
  app.delete(
    "/api/saas/templates/availability/:templateId",
    requireAuth,
    validateClinicOwnership,
    requireClinicManager,
    handleDeleteTemplate,
  );
  app.post(
    "/api/saas/templates/availability/:templateId/apply",
    requireAuth,
    validateClinicOwnership,
    handleApplyTemplate,
  );
}
