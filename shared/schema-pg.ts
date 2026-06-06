/**
 * Schema Drizzle para Postgres.
 *
 * Mantem paridade semantica com shared/schema.ts (SQLite). Usado em producao
 * quando DATABASE_URL aponta para Postgres.
 *
 * Diferencas vs SQLite:
 *  - timestamps como timestamp() do PG (com timezone)
 *  - boolean nativo (em vez de integer 0/1)
 *  - uuid via gen_random_uuid() (extensao pgcrypto)
 *  - indexes via index() helper de pg-core
 */

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const userRoles = ["admin", "professional", "reader", "operator"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoles }).notNull().default("professional"),
    crm: text("crm"),
    rqe: text("rqe"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedToTokenId: uuid("rotated_to_token_id"),
  },
  (t) => ({
    userIdx: index("refresh_tokens_user_idx").on(t.userId),
    tokenIdx: index("refresh_tokens_token_hash_idx").on(t.tokenHash),
  }),
);

export const consentTypes = [
  "termo_uso",
  "politica_privacidade",
  "tratamento_dados_saude",
  "responsavel_legal_menor",
  "comunicacao_email",
  "compartilhamento_profissional",
] as const;

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    patientId: uuid("patient_id"),
    consentType: text("consent_type", { enum: consentTypes }).notNull(),
    consentVersion: text("consent_version").notNull(),
    consentText: text("consent_text").notNull(),
    granted: boolean("granted").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    legalBasis: text("legal_basis"),
    purpose: text("purpose"),
  },
  (t) => ({
    userIdx: index("consents_user_idx").on(t.userId),
    patientIdx: index("consents_patient_idx").on(t.patientId),
    typeIdx: index("consents_type_idx").on(t.consentType),
  }),
);

export const auditEventTypes = [
  "auth.login.success",
  "auth.login.failure",
  "auth.logout",
  "auth.password.change",
  "auth.token.refresh",
  "auth.account.locked",
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
  "consent.granted",
  "consent.revoked",
  "data.export.request",
  "data.delete.request",
  "file.upload",
  "file.download",
  "file.delete",
  "lgpd.access",
] as const;

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type", { enum: auditEventTypes }).notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: boolean("success").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("audit_logs_user_idx").on(t.userId),
    eventIdx: index("audit_logs_event_idx").on(t.eventType),
    targetIdx: index("audit_logs_target_idx").on(t.targetType, t.targetId),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  }),
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    nameEncrypted: text("name_encrypted"),
    name: text("name"),
    birthDate: text("birth_date"),
    cpfEncrypted: text("cpf_encrypted"),
    cpfHash: text("cpf_hash"),
    cid: text("cid"),
    cidDescription: text("cid_description"),
    notesEncrypted: text("notes_encrypted"),
    notes: text("notes"),
    isAnonymized: boolean("is_anonymized").notNull().default(false),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("patients_owner_idx").on(t.ownerUserId),
    cpfHashIdx: index("patients_cpf_hash_idx").on(t.cpfHash),
  }),
);

export const scaleResults = pgTable(
  "scale_results",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
    appliedByUserId: uuid("applied_by_user_id").references(() => users.id, { onDelete: "set null" }),
    scaleName: text("scale_name").notNull(),
    scaleVersion: text("scale_version"),
    answers: text("answers").notNull(),
    answersEncrypted: text("answers_encrypted"),
    totalScore: integer("total_score").notNull(),
    classification: text("classification").notNull(),
    patientAge: text("patient_age"),
    domainScores: text("domain_scores"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdx: index("scale_results_patient_idx").on(t.patientId),
    scaleIdx: index("scale_results_scale_idx").on(t.scaleName),
    createdAtIdx: index("scale_results_created_at_idx").on(t.createdAt),
  }),
);

export const dataRequestTypes = ["export", "delete", "anonymize"] as const;
export const dataRequestStatuses = ["pending", "processing", "completed", "rejected"] as const;

export const dataRequests = pgTable(
  "data_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name"),
    requestType: text("request_type", { enum: dataRequestTypes }).notNull(),
    status: text("status", { enum: dataRequestStatuses }).notNull().default("pending"),
    relatedPatientId: uuid("related_patient_id"),
    notes: text("notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedByUserId: uuid("completed_by_user_id").references(() => users.id),
    artifactPath: text("artifact_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("data_requests_status_idx").on(t.status),
    typeIdx: index("data_requests_type_idx").on(t.requestType),
  }),
);

/**
 * FILES — metadata de arquivos no object storage.
 * O conteudo binario fica no bucket; aqui guardamos apenas referencia + metadata.
 */
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageProvider: text("storage_provider").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storageKey: text("storage_key").notNull(),
    encryptionEnabled: boolean("encryption_enabled").notNull().default(true),
    sha256: text("sha256"),
    category: text("category"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("files_owner_idx").on(t.ownerUserId),
    patientIdx: index("files_patient_idx").on(t.patientId),
    keyIdx: index("files_key_idx").on(t.storageKey),
  }),
);
