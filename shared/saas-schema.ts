/**
 * SaaS Schemas — Módulos complementares de operação e gestão
 *
 * Tabelas:
 * 1. onboarding_checklist — Tracking de etapas de ativação
 * 2. appointment_feedback — NPS, ratings e comentários pós-consulta
 * 3. availability_templates — Templates reutilizáveis de disponibilidade
 * 4. professional_template_assignments — Associação de templates a profissionais
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
 * ONBOARDING CHECKLIST — Tracking de progresso de ativação
 * ===================================================================== */

export const onboardingSteps = [
  "clinic_profile",
  "team_members",
  "services",
  "communication",
  "integrations",
] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingStepLabels: Record<OnboardingStep, string> = {
  clinic_profile: "Perfil da Clínica",
  team_members: "Membros da Equipe",
  services: "Serviços Oferecidos",
  communication: "Configurar Comunicação",
  integrations: "Integrações",
};

export const onboardingChecklist = sqliteTable(
  "onboarding_checklist",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").notNull(),
    stepId: text("step_id", { enum: onboardingSteps }).notNull(),
    stepLabel: text("step_label").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    completedAt: text("completed_at"),
    completedBy: text("completed_by"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    clinicStepIdx: uniqueIndex("idx_onboarding_clinic_step").on(t.clinicId, t.stepId),
    clinicIdx: index("idx_onboarding_clinic").on(t.clinicId),
    completedIdx: index("idx_onboarding_completed").on(t.completed),
  }),
);

export const insertOnboardingChecklistSchema = createInsertSchema(onboardingChecklist, {
  stepId: z.enum(onboardingSteps),
  stepLabel: z.string().min(1).max(255),
  clinicId: z.string().min(1).max(255),
  notes: z.string().max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingChecklist = z.infer<typeof insertOnboardingChecklistSchema>;
export type OnboardingChecklist = typeof onboardingChecklist.$inferSelect;

/**
 * Schema para completar uma etapa de onboarding
 */
export const completeOnboardingStepSchema = z
  .object({
    completedBy: z.string().min(1).max(255),
    notes: z.string().max(1000).optional(),
  })
  .strict();

export type CompleteOnboardingStepInput = z.infer<typeof completeOnboardingStepSchema>;

/* =====================================================================
 * APPOINTMENT FEEDBACK — NPS, ratings, comentários pós-consulta
 * ===================================================================== */

export const appointmentFeedback = sqliteTable(
  "appointment_feedback",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    appointmentId: text("appointment_id").notNull().unique(),
    clinicId: text("clinic_id").notNull(),
    rating: integer("rating"), // 1-5
    npsScore: integer("nps_score"), // 0-10
    comment: text("comment"),
    sentiment: text("sentiment"), // "positive" | "neutral" | "negative" (calculado)
    sentAt: text("sent_at"), // Quando convite foi enviado
    respondedAt: text("responded_at"), // Quando paciente respondeu
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    appointmentIdx: index("idx_feedback_appointment").on(t.appointmentId),
    clinicIdx: index("idx_feedback_clinic").on(t.clinicId),
    clinicDateIdx: index("idx_feedback_clinic_date").on(t.clinicId, t.createdAt),
    respondedIdx: index("idx_feedback_responded").on(t.respondedAt),
  }),
);

export const insertAppointmentFeedbackSchema = createInsertSchema(appointmentFeedback, {
  appointmentId: z.string().min(1).max(255),
  clinicId: z.string().min(1).max(255),
  rating: z.number().int().min(1).max(5).optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
  comment: z.string().max(2000).optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointmentFeedback = z.infer<typeof insertAppointmentFeedbackSchema>;
export type AppointmentFeedback = typeof appointmentFeedback.$inferSelect;

/**
 * Schema para responder pesquisa de feedback
 */
export const submitAppointmentFeedbackSchema = z
  .object({
    appointmentId: z.string().min(1).max(255),
    rating: z.number().int().min(1).max(5).optional(),
    npsScore: z.number().int().min(0).max(10).optional(),
    comment: z.string().max(2000).optional(),
  })
  .strict()
  .refine((data) => data.rating !== undefined || data.npsScore !== undefined, {
    message: "Deve fornecer pelo menos rating ou NPS score",
  });

export type SubmitAppointmentFeedbackInput = z.infer<typeof submitAppointmentFeedbackSchema>;

/* =====================================================================
 * AVAILABILITY TEMPLATES — Templates reutilizáveis de disponibilidade
 * ===================================================================== */

export const availabilityTemplates = sqliteTable(
  "availability_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /**
     * JSON structure:
     * {
     *   "monday": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
     *   "tuesday": [...],
     *   ...
     * }
     */
    rules: text("rules").notNull(), // JSON string
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    usageCount: integer("usage_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    clinicNameIdx: uniqueIndex("idx_template_clinic_name").on(t.clinicId, t.name),
    clinicIdx: index("idx_template_clinic").on(t.clinicId),
    activeIdx: index("idx_template_active").on(t.isActive),
  }),
);

export const insertAvailabilityTemplateSchema = createInsertSchema(availabilityTemplates, {
  clinicId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  rules: z.string().min(10), // Deve ser JSON válido
  createdBy: z.string().min(1).max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export type InsertAvailabilityTemplate = z.infer<typeof insertAvailabilityTemplateSchema>;
export type AvailabilityTemplate = typeof availabilityTemplates.$inferSelect;

/**
 * Schema para criar template via API
 */
export const createAvailabilityTemplateApiSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    rules: z.record(
      z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
      z.array(
        z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/),
          end: z.string().regex(/^\d{2}:\d{2}$/),
        }),
      ),
    ),
  })
  .strict();

export type CreateAvailabilityTemplateApi = z.infer<typeof createAvailabilityTemplateApiSchema>;

/* =====================================================================
 * PROFESSIONAL TEMPLATE ASSIGNMENTS — Associação de templates a profissionais
 * ===================================================================== */

export const professionalTemplateAssignments = sqliteTable(
  "professional_template_assignments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    professionalId: text("professional_id").notNull(),
    templateId: text("template_id").notNull(),
    clinicId: text("clinic_id").notNull(),
    appliedAt: text("applied_at").notNull().$defaultFn(() => new Date().toISOString()),
    appliedBy: text("applied_by").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    professionalTemplateIdx: uniqueIndex("idx_prof_template_assignment").on(
      t.professionalId,
      t.templateId,
    ),
    professionalIdx: index("idx_prof_assignment_professional").on(t.professionalId),
    templateIdx: index("idx_prof_assignment_template").on(t.templateId),
    clinicIdx: index("idx_prof_assignment_clinic").on(t.clinicId),
  }),
);

export const insertProfessionalTemplateAssignmentSchema = createInsertSchema(
  professionalTemplateAssignments,
  {
    professionalId: z.string().min(1).max(255),
    templateId: z.string().min(1).max(255),
    clinicId: z.string().min(1).max(255),
    appliedBy: z.string().min(1).max(255),
  },
).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export type InsertProfessionalTemplateAssignment = z.infer<
  typeof insertProfessionalTemplateAssignmentSchema
>;
export type ProfessionalTemplateAssignment = typeof professionalTemplateAssignments.$inferSelect;

/**
 * Schema para aplicar template a um profissional
 */
export const applyTemplateSchema = z
  .object({
    templateId: z.string().min(1).max(255),
    appliedBy: z.string().min(1).max(255),
  })
  .strict();

export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;

/* =====================================================================
 * TENANT LIFECYCLE EVENTS — Para rastrear transições de estado
 * ===================================================================== */

export const lifecycleEventTypes = [
  "created",
  "activated",
  "closure_requested",
  "closed",
  "reactivation_requested",
  "reactivated",
  "legal_hold_placed",
  "legal_hold_released",
] as const;
export type LifecycleEventType = (typeof lifecycleEventTypes)[number];

export const tenantLifecycleEvents = sqliteTable(
  "tenant_lifecycle_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull(),
    eventType: text("event_type", { enum: lifecycleEventTypes }).notNull(),
    reason: text("reason"),
    triggeredBy: text("triggered_by").notNull(),
    previousState: text("previous_state"),
    newState: text("new_state"),
    metadata: text("metadata"), // JSON
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    tenantIdx: index("idx_lifecycle_tenant").on(t.tenantId),
    eventTypeIdx: index("idx_lifecycle_event_type").on(t.eventType),
  }),
);

export type TenantLifecycleEvent = typeof tenantLifecycleEvents.$inferSelect;
export type InsertTenantLifecycleEvent = typeof tenantLifecycleEvents.$inferInsert;

/* =====================================================================
 * AGGREGATE TYPES — Para respostas de API
 * ===================================================================== */

/**
 * Resposta de progresso do onboarding
 */
export interface OnboardingProgress {
  clinicId: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  steps: Array<OnboardingChecklist>;
  nextStep: OnboardingStep | null;
  estimatedCompletionDays: number;
}

/**
 * Métricas de feedback de operações
 */
export interface OperationsFeedbackMetrics {
  clinicId: string;
  periodFrom: string;
  periodTo: string;
  totalResponses: number;
  totalAppointments: number;
  responseRate: number; // 0-100
  averageRating: number | null; // 1-5
  averageNps: number | null; // 0-10
  npsCategory: "detractors" | "passives" | "promoters" | null;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const operationsFeedbackMetricsSchema = z.object({
  clinicId: z.string(),
  periodFrom: z.string().datetime(),
  periodTo: z.string().datetime(),
  totalResponses: z.number().int().nonnegative(),
  totalAppointments: z.number().int().nonnegative(),
  responseRate: z.number().min(0).max(100),
  averageRating: z.number().min(1).max(5).nullable(),
  averageNps: z.number().min(0).max(10).nullable(),
  npsCategory: z.enum(["detractors", "passives", "promoters"]).nullable(),
  sentimentBreakdown: z.object({
    positive: z.number().nonnegative(),
    neutral: z.number().nonnegative(),
    negative: z.number().nonnegative(),
  }),
});
