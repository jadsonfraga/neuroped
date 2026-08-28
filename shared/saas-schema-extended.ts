/**
 * Extended SaaS Schemas — Communication Templates, Institutions, Rate Limiting
 *
 * Modules:
 * 4. communication_templates — Email, SMS, WhatsApp templates with variable substitution
 * 5. institutions — B2B multi-clinic management (parent orgs)
 * 6. rate_limit_state — Per-clinic API rate limit tracking
 * 7. authorization_logs — Audit trail of access attempts (allowed/denied)
 */

import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =====================================================================
 * COMMUNICATION TEMPLATES — Module 4: Email, SMS, WhatsApp
 * ===================================================================== */

export const communicationChannels = ["email", "sms", "whatsapp"] as const;
export type CommunicationChannel = (typeof communicationChannels)[number];

export const communicationTemplates = sqliteTable(
  "communication_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").notNull(),
    name: text("name").notNull(),
    channel: text("channel", { enum: communicationChannels }).notNull(),
    subject: text("subject"), // For email only
    body: text("body").notNull(),
    variables: text("variables"), // JSON array of variable names, e.g. ["patientName", "appointmentDate"]
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    usageCount: integer("usage_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    clinicChannelIdx: uniqueIndex("idx_template_clinic_channel").on(t.clinicId, t.channel, t.name),
    clinicIdx: index("idx_template_clinic").on(t.clinicId),
    activeIdx: index("idx_template_active").on(t.isActive),
  }),
);

export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates, {
  clinicId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  channel: z.enum(communicationChannels),
  subject: z.string().max(500).optional(),
  body: z.string().min(10).max(5000),
  variables: z.string().optional(), // JSON string
  createdBy: z.string().min(1).max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;

/**
 * Schema para enviar comunicação via template
 */
export const sendCommunicationSchema = z
  .object({
    templateId: z.string().min(1).max(255),
    channel: z.enum(communicationChannels),
    recipientId: z.string().min(1).max(255), // patient or professional ID
    recipientEmail: z.string().email().optional(),
    recipientPhone: z.string().optional(),
    variables: z.record(z.string(), z.string()).optional(), // { patientName: "João", appointmentDate: "2026-09-01" }
  })
  .strict();

export type SendCommunicationInput = z.infer<typeof sendCommunicationSchema>;

/* =====================================================================
 * INSTITUTIONS — Module 5: B2B Multi-Clinic Management
 * ===================================================================== */

export const institutions = sqliteTable(
  "institutions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    cnpj: text("cnpj").unique(), // Brazilian business registry
    country: text("country").notNull().default("BR"),
    city: text("city"),
    state: text("state"),
    website: text("website"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    adminUserId: text("admin_user_id").notNull(), // Primary admin
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    clinicCount: integer("clinic_count").notNull().default(0),
    metadata: text("metadata"), // JSON: custom fields, branding, etc
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    cnpjIdx: index("idx_institution_cnpj").on(t.cnpj),
    adminIdx: index("idx_institution_admin").on(t.adminUserId),
    activeIdx: index("idx_institution_active").on(t.isActive),
  }),
);

export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = typeof institutions.$inferInsert;

/**
 * Associação: Institution → Clinic (one-to-many)
 */
export const institutionClinicAssignments = sqliteTable(
  "institution_clinic_assignments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    institutionId: text("institution_id").notNull(),
    clinicId: text("clinic_id").notNull().unique(), // One clinic per institution max
    role: text("role", { enum: ["primary", "secondary", "satellite"] }).default("primary"), // Multi-clinic hierarchy
    assignedAt: text("assigned_at").notNull().$defaultFn(() => new Date().toISOString()),
    assignedBy: text("assigned_by").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    institutionIdx: index("idx_ica_institution").on(t.institutionId),
    clinicIdx: index("idx_ica_clinic").on(t.clinicId),
    institutionClinicIdx: uniqueIndex("idx_ica_institution_clinic").on(t.institutionId, t.clinicId),
  }),
);

export type InstitutionClinicAssignment = typeof institutionClinicAssignments.$inferSelect;

/**
 * Usuários com múltiplas roles em uma instituição
 */
export const institutionUsers = sqliteTable(
  "institution_users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    institutionId: text("institution_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["admin", "manager", "operator", "viewer"] }).notNull(),
    grantedAt: text("granted_at").notNull().$defaultFn(() => new Date().toISOString()),
    grantedBy: text("granted_by").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    institutionUserIdx: uniqueIndex("idx_inst_user_role").on(t.institutionId, t.userId),
    institutionIdx: index("idx_inst_user_institution").on(t.institutionId),
    roleIdx: index("idx_inst_user_role_type").on(t.role),
  }),
);

export type InstitutionUser = typeof institutionUsers.$inferSelect;

export const createInstitutionSchema = z
  .object({
    name: z.string().min(2).max(255),
    legalName: z.string().max(255).optional(),
    cnpj: z.string().regex(/^\d{14}$/).optional(),
    country: z.string().default("BR"),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    website: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(20).optional(),
  })
  .strict();

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;

/* =====================================================================
 * RATE LIMIT STATE — Module 6: Per-Clinic API Rate Limiting
 * ===================================================================== */

export const rateLimitState = sqliteTable(
  "rate_limit_state",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").notNull(),
    endpoint: text("endpoint").notNull(), // e.g., "/api/saas/feedback/metrics"
    windowStart: text("window_start").notNull(), // ISO 8601 timestamp
    windowEnd: text("window_end").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    limitPerWindow: integer("limit_per_window").notNull().default(100),
    status: text("status", { enum: ["active", "throttled", "blocked"] }).default("active"),
    lastRequestAt: text("last_request_at"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    clinicEndpointIdx: uniqueIndex("idx_rl_clinic_endpoint").on(t.clinicId, t.endpoint, t.windowStart),
    clinicIdx: index("idx_rl_clinic").on(t.clinicId),
    statusIdx: index("idx_rl_status").on(t.status),
    windowIdx: index("idx_rl_window").on(t.windowStart, t.windowEnd),
  }),
);

export type RateLimitState = typeof rateLimitState.$inferSelect;

/**
 * Rate limit configuration per endpoint
 */
export const rateLimitConfig = {
  "GET /api/saas/onboarding/progress": { requestsPerMinute: 30, requestsPerHour: 500 },
  "POST /api/saas/feedback/appointments/:id/submit": { requestsPerMinute: 100, requestsPerHour: 1000 },
  "GET /api/saas/feedback/metrics": { requestsPerMinute: 10, requestsPerHour: 100 },
  "POST /api/saas/lifecycle/request-reactivation": { requestsPerMinute: 5, requestsPerHour: 50 },
  "GET /api/saas/templates/availability": { requestsPerMinute: 30, requestsPerHour: 500 },
  "POST /api/saas/templates/availability": { requestsPerMinute: 10, requestsPerHour: 100 },
};

/* =====================================================================
 * AUTHORIZATION LOGS — Module 7: Access Audit Trail
 * ===================================================================== */

export const authorizationLogs = sqliteTable(
  "authorization_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").notNull(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(), // "create_template", "view_metrics", etc
    resource: text("resource"), // "template:123", "clinic:456"
    result: text("result", { enum: ["allowed", "denied"] }).notNull(),
    reason: text("reason"), // "insufficient_role", "clinic_mismatch", "rate_limit_exceeded"
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    clinicIdx: index("idx_auth_log_clinic").on(t.clinicId),
    userIdx: index("idx_auth_log_user").on(t.userId),
    resultIdx: index("idx_auth_log_result").on(t.result),
    dateIdx: index("idx_auth_log_date").on(t.createdAt),
  }),
);

export type AuthorizationLog = typeof authorizationLogs.$inferSelect;
