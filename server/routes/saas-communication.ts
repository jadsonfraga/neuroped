/**
 * API de Templates de Comunicação — Email, SMS, WhatsApp
 *
 * Endpoints:
 * POST   /api/saas/templates/communication
 * GET    /api/saas/templates/communication
 * GET    /api/saas/templates/communication/:templateId
 * PATCH  /api/saas/templates/communication/:templateId
 * DELETE /api/saas/templates/communication/:templateId
 * POST   /api/saas/communication/send
 */

import type { Express } from "express";
import { z } from "zod";
import { db } from "../storage.js";
import {
  communicationTemplates,
  communicationChannels,
  sendCommunicationSchema,
  type CommunicationTemplate,
} from "@shared/saas-schema-extended";
import { requireAuth } from "../middleware/auth.js";
import {
  validateClinicOwnership,
  validateProfessionalOwnership,
  logAuthorizationAttempt,
  type AuthorizationContext,
} from "../middleware/saas-authorization.js";

const createTemplateSchema = z
  .object({
    name: z.string().min(1).max(255),
    channel: z.enum(communicationChannels),
    subject: z.string().max(500).optional(),
    body: z.string().min(10).max(5000),
    variables: z.array(z.string()).optional(), // ["patientName", "appointmentDate"]
  })
  .strict();

type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

/**
 * POST /api/saas/templates/communication
 * Cria novo template de comunicação
 */
function handleCreateCommunicationTemplate(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const body = req.body;
    const input = createTemplateSchema.parse(body);
    const user = req.user as any;
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!user || !clinicId) {
      if (authContext) {
        logAuthorizationAttempt(authContext, "create_communication_template", undefined, "denied", "unauthorized");
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if template already exists
    const existing = db
      .select()
      .from(communicationTemplates)
      .where(
        (t: any) =>
          t.clinicId.eq(clinicId) &&
          t.channel.eq(input.channel) &&
          t.name.eq(input.name),
      )
      .first();

    if (existing) {
      logAuthorizationAttempt(authContext, "create_communication_template", `template:${input.name}`, "denied", "duplicate");
      return res.status(409).json({
        error: `Template "${input.name}" already exists for channel ${input.channel}`,
      });
    }

    const now = new Date().toISOString();
    const templateId = `tpl_${crypto.randomUUID()}`;

    db.insert(communicationTemplates).values({
      id: templateId,
      clinicId,
      name: input.name,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      variables: input.variables ? JSON.stringify(input.variables) : undefined,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    } as any);

    logAuthorizationAttempt(authContext, "create_communication_template", `template:${templateId}`, "allowed");

    return res.status(201).json({
      success: true,
      template: {
        id: templateId,
        clinicId,
        name: input.name,
        channel: input.channel,
        subject: input.subject,
        body: input.body,
        variables: input.variables || [],
        isActive: true,
        usageCount: 0,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error creating communication template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/templates/communication
 * Lista templates de comunicação da clínica
 */
function handleListCommunicationTemplates(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const channel = req.query.channel as string;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId" });
    }

    let query = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.clinicId.eq(clinicId));

    if (channel && communicationChannels.includes(channel as any)) {
      query = query.where((t: any) => t.channel.eq(channel));
    }

    const templates = query.all();

    logAuthorizationAttempt(authContext, "list_communication_templates", `clinic:${clinicId}`, "allowed");

    const parsed = templates.map((t: any) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }));

    return res.json({
      clinicId,
      total: parsed.length,
      templates: parsed,
    });
  } catch (error) {
    console.error("Error listing communication templates:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/templates/communication/:templateId
 * Retorna detalhes de um template
 */
function handleGetCommunicationTemplate(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const templateId = req.params.templateId;
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId" });
    }

    const template = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.id.eq(templateId) && t.clinicId.eq(clinicId))
      .first();

    if (!template) {
      logAuthorizationAttempt(authContext, "get_communication_template", `template:${templateId}`, "denied", "not_found");
      return res.status(404).json({ error: "Template not found" });
    }

    logAuthorizationAttempt(authContext, "get_communication_template", `template:${templateId}`, "allowed");

    return res.json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
    });
  } catch (error) {
    console.error("Error fetching communication template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/saas/templates/communication/:templateId
 * Atualiza um template
 */
function handleUpdateCommunicationTemplate(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const templateId = req.params.templateId;
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const user = req.user as any;
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!clinicId || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const template = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.id.eq(templateId) && t.clinicId.eq(clinicId))
      .first();

    if (!template) {
      logAuthorizationAttempt(authContext, "update_communication_template", `template:${templateId}`, "denied", "not_found");
      return res.status(404).json({ error: "Template not found" });
    }

    const { name, body, subject, variables, isActive } = req.body;
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (body) updates.body = body;
    if (subject !== undefined) updates.subject = subject;
    if (variables) updates.variables = JSON.stringify(variables);
    if (isActive !== undefined) updates.isActive = isActive;

    db.update(communicationTemplates)
      .set(updates as any)
      .where((t: any) => t.id.eq(templateId))
      .run();

    logAuthorizationAttempt(authContext, "update_communication_template", `template:${templateId}`, "allowed");

    const updated = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.id.eq(templateId))
      .first();

    return res.json({
      success: true,
      template: {
        ...updated,
        variables: updated.variables ? JSON.parse(updated.variables) : [],
      },
    });
  } catch (error) {
    console.error("Error updating communication template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/saas/templates/communication/:templateId
 * Deleta um template (soft delete)
 */
function handleDeleteCommunicationTemplate(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const templateId = req.params.templateId;
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId" });
    }

    const template = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.id.eq(templateId) && t.clinicId.eq(clinicId))
      .first();

    if (!template) {
      logAuthorizationAttempt(authContext, "delete_communication_template", `template:${templateId}`, "denied", "not_found");
      return res.status(404).json({ error: "Template not found" });
    }

    db.update(communicationTemplates)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      } as any)
      .where((t: any) => t.id.eq(templateId))
      .run();

    logAuthorizationAttempt(authContext, "delete_communication_template", `template:${templateId}`, "allowed");

    return res.json({
      success: true,
      message: "Template deleted successfully",
      templateId,
    });
  } catch (error) {
    console.error("Error deleting communication template:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/saas/communication/send
 * Envia comunicação usando um template
 */
function handleSendCommunication(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const body = req.body;
    const input = sendCommunicationSchema.parse(body);
    const clinicId = (req as any).clinicId || (req.query.clinicId as string);
    const authContext = (req as any).authContext as AuthorizationContext;

    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId" });
    }

    // Get template
    const template = db
      .select()
      .from(communicationTemplates)
      .where((t: any) => t.id.eq(input.templateId) && t.clinicId.eq(clinicId))
      .first();

    if (!template) {
      logAuthorizationAttempt(authContext, "send_communication", `template:${input.templateId}`, "denied", "template_not_found");
      return res.status(404).json({ error: "Template not found" });
    }

    // TODO: Render template with variables
    // const renderedBody = renderTemplate(template.body, input.variables || {});
    // const renderedSubject = template.subject ? renderTemplate(template.subject, input.variables || {}) : undefined;

    // TODO: Send via appropriate channel
    // switch (input.channel) {
    //   case "email": await sendEmail(...);
    //   case "sms": await sendSMS(...);
    //   case "whatsapp": await sendWhatsApp(...);
    // }

    // TODO: Update usage count
    db.update(communicationTemplates)
      .set({
        usageCount: (template.usageCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      } as any)
      .where((t: any) => t.id.eq(input.templateId))
      .run();

    logAuthorizationAttempt(authContext, "send_communication", `template:${input.templateId}`, "allowed");

    return res.json({
      success: true,
      message: `Communication sent via ${input.channel}`,
      templateId: input.templateId,
      channel: input.channel,
      recipientId: input.recipientId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error sending communication:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Registra rotas de comunicação
 */
export function registerCommunicationRoutes(app: Express) {
  app.post(
    "/api/saas/templates/communication",
    requireAuth,
    validateClinicOwnership,
    handleCreateCommunicationTemplate,
  );
  app.get(
    "/api/saas/templates/communication",
    requireAuth,
    validateClinicOwnership,
    handleListCommunicationTemplates,
  );
  app.get(
    "/api/saas/templates/communication/:templateId",
    requireAuth,
    validateClinicOwnership,
    handleGetCommunicationTemplate,
  );
  app.patch(
    "/api/saas/templates/communication/:templateId",
    requireAuth,
    validateClinicOwnership,
    handleUpdateCommunicationTemplate,
  );
  app.delete(
    "/api/saas/templates/communication/:templateId",
    requireAuth,
    validateClinicOwnership,
    handleDeleteCommunicationTemplate,
  );
  app.post(
    "/api/saas/communication/send",
    requireAuth,
    validateClinicOwnership,
    handleSendCommunication,
  );
}
