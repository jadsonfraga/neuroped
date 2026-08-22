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
 * USERS — Profissionais e administradores do sistema
 * ===================================================================== */

export const userRoles = ["admin", "professional", "reader", "operator"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoles }).notNull().default("professional"),
    crm: text("crm"),
    rqe: text("rqe"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    emailVerifiedAt: text("email_verified_at"),
    lastLoginAt: text("last_login_at"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: text("locked_until"),
    mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  }),
);

export const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email().toLowerCase().trim().max(255),
  name: (s) => s.min(2).max(120),
  passwordHash: (s) => s.min(20),
  role: z.enum(userRoles).default("professional"),
  crm: z.string().max(20).optional(),
  rqe: z.string().max(20).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  lastLoginAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/** Schema para criar usuario via API (recebe senha em texto) */
export const createUserApiSchema = z
  .object({
    email: z.string().email().toLowerCase().trim().max(255),
    name: z.string().min(2).max(120),
    password: z
      .string()
      .min(12, "Senha deve ter no minimo 12 caracteres")
      .max(128)
      .regex(/[A-Z]/, "Senha deve conter letra maiuscula")
      .regex(/[a-z]/, "Senha deve conter letra minuscula")
      .regex(/[0-9]/, "Senha deve conter numero")
      .regex(/[^A-Za-z0-9]/, "Senha deve conter caractere especial"),
    role: z.enum(userRoles).default("professional"),
    crm: z.string().max(20).optional(),
    rqe: z.string().max(20).optional(),
  })
  .strict();
export type CreateUserApi = z.infer<typeof createUserApiSchema>;

export const loginSchema = z
  .object({
    email: z.string().email().toLowerCase().trim().max(255),
    password: z.string().min(1).max(256),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

/* =====================================================================
 * REFRESH TOKENS — sessoes long-lived com rotacao
 * ===================================================================== */

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    issuedAt: text("issued_at").notNull().$defaultFn(() => new Date().toISOString()),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    rotatedToTokenId: text("rotated_to_token_id"),
  },
  (t) => ({
    userIdx: index("refresh_tokens_user_idx").on(t.userId),
    tokenHashIdx: index("refresh_tokens_token_hash_idx").on(t.tokenHash),
  }),
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;

/* =====================================================================
 * CONSENTS — registro substantivo LGPD
 * ===================================================================== */

export const consentTypes = [
  "termo_uso",
  "politica_privacidade",
  "tratamento_dados_saude",
  "responsavel_legal_menor",
  "comunicacao_email",
  "compartilhamento_profissional",
] as const;
export type ConsentType = (typeof consentTypes)[number];

export const consents = sqliteTable(
  "consents",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    /** Nulo apenas em registros legados anteriores ao contrato em lote. */
    batchId: text("batch_id"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    patientId: text("patient_id"),
    consentType: text("consent_type", { enum: consentTypes }).notNull(),
    consentVersion: text("consent_version").notNull(),
    consentText: text("consent_text").notNull(),
    granted: integer("granted", { mode: "boolean" }).notNull(),
    grantedAt: text("granted_at").notNull().$defaultFn(() => new Date().toISOString()),
    /** Instante declarado pelo cliente; obrigatório para todas as novas gravações. */
    acceptedAt: text("accepted_at"),
    revokedAt: text("revoked_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    legalBasis: text("legal_basis"),
    purpose: text("purpose"),
  },
  (t) => ({
    userIdx: index("consents_user_idx").on(t.userId),
    patientIdx: index("consents_patient_idx").on(t.patientId),
    typeIdx: index("consents_type_idx").on(t.consentType),
    batchIdx: index("consents_batch_idx").on(t.batchId),
    userAcceptedIdx: index("consents_user_accepted_idx").on(
      t.userId,
      t.acceptedAt,
    ),
    idempotencyIdx: uniqueIndex("consents_idempotency_idx").on(
      t.userId,
      t.consentType,
      t.consentVersion,
      t.acceptedAt,
    ),
  }),
);

export const insertConsentSchema = createInsertSchema(consents, {
  consentType: z.enum(consentTypes),
  granted: z.boolean(),
}).omit({
  id: true,
  grantedAt: true,
  revokedAt: true,
});
export type InsertConsent = z.infer<typeof insertConsentSchema>;
export type Consent = typeof consents.$inferSelect;

/* =====================================================================
 * AUDIT LOGS — quem fez o que, quando, com qual contexto
 * ===================================================================== */

export const auditEventTypes = [
  "auth.login.success",
  "auth.login.failure",
  "auth.logout",
  "auth.password.reset.request",
  "auth.password.reset.complete",
  "auth.password.change",
  "auth.token.refresh",
  "auth.account.locked",
  "auth.pin.success",
  "auth.pin.failure",
  "user.create",
  "user.update",
  "user.delete",
  "user.role.change",
  "patient.create",
  "patient.read",
  "patient.update",
  "patient.delete",
  "patient.export",
  "result.create",
  "result.read",
  "result.update",
  "result.delete",
  "share.create",
  "share.submit",
  "consent.batch.granted",
  "consent.granted",
  "consent.revoked",
  "data.export.request",
  "data.delete.request",
  "lgpd.access",
  "file.upload",
  "file.download",
  "file.delete",
  "document.create",
  "document.read",
  "document.verify",
  "document.delete",
] as const;
export type AuditEventType = (typeof auditEventTypes)[number];

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type", { enum: auditEventTypes }).notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: integer("success", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    userIdx: index("audit_logs_user_idx").on(t.userId),
    eventIdx: index("audit_logs_event_idx").on(t.eventType),
    targetIdx: index("audit_logs_target_idx").on(t.targetType, t.targetId),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  }),
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/* =====================================================================
 * PATIENTS — dados de pacientes (campos sensiveis criptografados)
 * Os campos com sufixo "Encrypted" guardam payload AES-GCM em base64.
 * ===================================================================== */

export const patients = sqliteTable(
  "patients",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    nameEncrypted: text("name_encrypted"),
    name: text("name"),
    birthDate: text("birth_date"),
    cpfEncrypted: text("cpf_encrypted"),
    cpfHash: text("cpf_hash"),
    cid: text("cid"),
    cidDescription: text("cid_description"),
    notesEncrypted: text("notes_encrypted"),
    notes: text("notes"),
    isAnonymized: integer("is_anonymized", { mode: "boolean" }).notNull().default(false),
    anonymizedAt: text("anonymized_at"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    ownerIdx: index("patients_owner_idx").on(t.ownerUserId),
    cpfHashIdx: index("patients_cpf_hash_idx").on(t.cpfHash),
  }),
);

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isAnonymized: true,
  anonymizedAt: true,
});
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

/** Schema para API publica (recebe campos em texto, server criptografa antes de gravar) */
export const patientApiSchema = z
  .object({
    name: z.string().min(2).max(120),
    birthDate: z.string().max(10).optional(),
    cpf: z
      .string()
      .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF invalido")
      .optional(),
    cid: z.string().max(20).optional(),
    cidDescription: z.string().max(255).optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict();
export type PatientApi = z.infer<typeof patientApiSchema>;

/* =====================================================================
 * SCALE RESULTS — respostas aplicadas
 * ===================================================================== */

export const scaleResults = sqliteTable(
  "scale_results",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id").references(() => patients.id, { onDelete: "cascade" }),
    appliedByUserId: text("applied_by_user_id").references(() => users.id, { onDelete: "set null" }),
    scaleName: text("scale_name").notNull(),
    scaleVersion: text("scale_version"),
    answers: text("answers").notNull(),
    answersEncrypted: text("answers_encrypted"),
    totalScore: integer("total_score").notNull(),
    classification: text("classification").notNull(),
    patientAge: text("patient_age"),
    domainScores: text("domain_scores"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    patientIdx: index("scale_results_patient_idx").on(t.patientId),
    scaleIdx: index("scale_results_scale_idx").on(t.scaleName),
    createdAtIdx: index("scale_results_created_at_idx").on(t.createdAt),
  }),
);

export const insertScaleResultSchema = createInsertSchema(scaleResults).omit({
  id: true,
  createdAt: true,
});
export type InsertScaleResult = z.infer<typeof insertScaleResultSchema>;
export type ScaleResult = typeof scaleResults.$inferSelect;

/* =====================================================================
 * SCALE SHARE SESSIONS — links temporários para respostas familiares
 * O token bruto nunca é armazenado; apenas seu hash SHA-256.
 * ===================================================================== */

export const scaleShareStatuses = ["pending", "submitted", "revoked"] as const;
export type ScaleShareStatus = (typeof scaleShareStatuses)[number];

export const scaleShareSessions = sqliteTable(
  "scale_share_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    tokenHash: text("token_hash").notNull().unique(),
    selectedScales: text("selected_scales").notNull(),
    status: text("status", { enum: scaleShareStatuses })
      .notNull()
      .default("pending"),
    expiresAt: text("expires_at").notNull(),
    submittedAt: text("submitted_at"),
    respondentName: text("respondent_name"),
    resultIds: text("result_ids"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    patientIdx: index("scale_share_sessions_patient_idx").on(t.patientId),
    tokenIdx: index("scale_share_sessions_token_idx").on(t.tokenHash),
    statusIdx: index("scale_share_sessions_status_idx").on(t.status),
    expiresIdx: index("scale_share_sessions_expires_idx").on(t.expiresAt),
  }),
);

export const insertScaleShareSessionSchema = createInsertSchema(
  scaleShareSessions,
  { status: z.enum(scaleShareStatuses) },
).omit({
  id: true,
  createdAt: true,
});
export type InsertScaleShareSession = z.infer<
  typeof insertScaleShareSessionSchema
>;
export type ScaleShareSession = typeof scaleShareSessions.$inferSelect;

/* =====================================================================
 * DATA EXPORT REQUESTS — pedidos LGPD art. 18 (portabilidade/exclusao)
 * ===================================================================== */

export const dataRequestTypes = ["export", "delete", "anonymize"] as const;
export type DataRequestType = (typeof dataRequestTypes)[number];
export const dataRequestStatuses = ["pending", "processing", "completed", "rejected"] as const;
export type DataRequestStatus = (typeof dataRequestStatuses)[number];

export const dataRequests = sqliteTable(
  "data_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name"),
    requestType: text("request_type", { enum: dataRequestTypes }).notNull(),
    status: text("status", { enum: dataRequestStatuses }).notNull().default("pending"),
    relatedPatientId: text("related_patient_id"),
    notes: text("notes"),
    completedAt: text("completed_at"),
    completedByUserId: text("completed_by_user_id").references(() => users.id),
    artifactPath: text("artifact_path"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    statusIdx: index("data_requests_status_idx").on(t.status),
    typeIdx: index("data_requests_type_idx").on(t.requestType),
  }),
);

export type DataRequest = typeof dataRequests.$inferSelect;
export type InsertDataRequest = typeof dataRequests.$inferInsert;

/* =====================================================================
 * FILES — metadata de arquivos no object storage (cloud)
 * Conteudo binario fica no bucket; aqui apenas referencia + metadata.
 * ===================================================================== */

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    patientId: text("patient_id").references(() => patients.id, { onDelete: "set null" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageProvider: text("storage_provider").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storageKey: text("storage_key").notNull(),
    encryptionEnabled: integer("encryption_enabled", { mode: "boolean" }).notNull().default(true),
    sha256: text("sha256"),
    category: text("category"),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    ownerIdx: index("files_owner_idx").on(t.ownerUserId),
    patientIdx: index("files_patient_idx").on(t.patientId),
    keyIdx: index("files_key_idx").on(t.storageKey),
  }),
);

export type FileRecord = typeof files.$inferSelect;
export type InsertFileRecord = typeof files.$inferInsert;

/* =====================================================================
 * CLINICAL DOCUMENTS — índice imutável de PDFs clínicos persistidos
 * O binário permanece no object storage; este registro guarda a identidade,
 * integridade, origem e metadados públicos de assinatura.
 * ===================================================================== */

export const clinicalDocumentTypes = ["laudo", "receita", "escala"] as const;
export type ClinicalDocumentType = (typeof clinicalDocumentTypes)[number];

export const clinicalDocumentSignatureStatuses = ["unsigned", "signed", "verified"] as const;
export type ClinicalDocumentSignatureStatus = (typeof clinicalDocumentSignatureStatuses)[number];

export const clinicalDocuments = sqliteTable(
  "clinical_documents",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    patientId: text("patient_id").references(() => patients.id, { onDelete: "set null" }),
    fileId: text("file_id").references(() => files.id, { onDelete: "set null" }),
    documentType: text("document_type", { enum: clinicalDocumentTypes }).notNull(),
    title: text("title").notNull(),
    sourceId: text("source_id"),
    sourceVersion: text("source_version"),
    signatureStatus: text("signature_status", { enum: clinicalDocumentSignatureStatuses }).notNull().default("unsigned"),
    signatureType: text("signature_type"),
    signatureAlgorithm: text("signature_algorithm"),
    signerName: text("signer_name"),
    certificateSubject: text("certificate_subject"),
    certificateIssuer: text("certificate_issuer"),
    certificateSerial: text("certificate_serial"),
    certificateValidUntil: text("certificate_valid_until"),
    sha256: text("sha256"),
    retentionPolicy: text("retention_policy").notNull().default("permanent"),
    isImmutable: integer("is_immutable", { mode: "boolean" }).notNull().default(true),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => ({
    ownerIdx: index("clinical_documents_owner_idx").on(t.ownerUserId),
    patientIdx: index("clinical_documents_patient_idx").on(t.patientId),
    fileIdx: uniqueIndex("clinical_documents_file_idx").on(t.fileId),
    sourceIdx: index("clinical_documents_source_idx").on(t.sourceId),
    createdAtIdx: index("clinical_documents_created_at_idx").on(t.createdAt),
  }),
);

export type ClinicalDocument = typeof clinicalDocuments.$inferSelect;
export type InsertClinicalDocument = typeof clinicalDocuments.$inferInsert;
