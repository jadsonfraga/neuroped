import { boundedText } from "../_request";

/**
 * Identidade por tenant/usuário (migração 0019). O bootstrap de runtime
 * espelha a migração (IF NOT EXISTS) para que os endpoints funcionem mesmo em
 * bancos onde 0019 ainda não rodou — mesma política do operations hardening.
 */
const SELF_SERVICE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    credentials_line TEXT NOT NULL DEFAULT '',
    specialty TEXT NOT NULL DEFAULT '',
    document_email TEXT NOT NULL DEFAULT '',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS clinic_settings (
    clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    address_line1 TEXT NOT NULL DEFAULT '',
    address_line2 TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    public_email TEXT NOT NULL DEFAULT '',
    company_line TEXT NOT NULL DEFAULT '',
    motto TEXT NOT NULL DEFAULT '',
    updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
] as const;

export async function ensureSelfServiceSchema(db: D1Database): Promise<void> {
  await db.batch(SELF_SERVICE_SCHEMA.map((sql) => db.prepare(sql)));
}

export interface UserProfile {
  displayName: string;
  credentialsLine: string;
  specialty: string;
  documentEmail: string;
  configured: boolean;
  updatedAt: string | null;
}

export interface ClinicSettings {
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  publicEmail: string;
  companyLine: string;
  motto: string;
  configured: boolean;
  updatedAt: string | null;
}

const EMPTY_PROFILE: UserProfile = {
  displayName: "",
  credentialsLine: "",
  specialty: "",
  documentEmail: "",
  configured: false,
  updatedAt: null,
};

const EMPTY_SETTINGS: ClinicSettings = {
  displayName: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  publicEmail: "",
  companyLine: "",
  motto: "",
  configured: false,
  updatedAt: null,
};

export async function getUserProfile(db: D1Database, userId: string): Promise<UserProfile> {
  const row = await db
    .prepare(
      `SELECT display_name, credentials_line, specialty, document_email, updated_at
         FROM user_profiles WHERE user_id = ? LIMIT 1`,
    )
    .bind(userId)
    .first<{
      display_name: string;
      credentials_line: string;
      specialty: string;
      document_email: string;
      updated_at: string;
    }>();
  if (!row) return EMPTY_PROFILE;
  return {
    displayName: row.display_name,
    credentialsLine: row.credentials_line,
    specialty: row.specialty,
    documentEmail: row.document_email,
    configured: Boolean(row.display_name),
    updatedAt: row.updated_at,
  };
}

export interface UserProfileInput {
  displayName: string;
  credentialsLine: string;
  specialty: string;
  documentEmail: string;
}

export function parseUserProfileInput(body: Record<string, unknown>): UserProfileInput {
  return {
    displayName: boundedText(body.displayName, 160),
    credentialsLine: boundedText(body.credentialsLine, 240),
    specialty: boundedText(body.specialty, 120),
    documentEmail: boundedText(body.documentEmail, 254),
  };
}

export async function upsertUserProfile(
  db: D1Database,
  userId: string,
  input: UserProfileInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO user_profiles (user_id, display_name, credentials_line, specialty, document_email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         display_name = excluded.display_name,
         credentials_line = excluded.credentials_line,
         specialty = excluded.specialty,
         document_email = excluded.document_email,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, input.displayName, input.credentialsLine, input.specialty, input.documentEmail, now)
    .run();
}

export async function getClinicSettings(db: D1Database, clinicId: string): Promise<ClinicSettings> {
  const row = await db
    .prepare(
      `SELECT display_name, address_line1, address_line2, phone, public_email,
              company_line, motto, updated_at
         FROM clinic_settings WHERE clinic_id = ? LIMIT 1`,
    )
    .bind(clinicId)
    .first<{
      display_name: string;
      address_line1: string;
      address_line2: string;
      phone: string;
      public_email: string;
      company_line: string;
      motto: string;
      updated_at: string;
    }>();
  if (!row) return EMPTY_SETTINGS;
  return {
    displayName: row.display_name,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    phone: row.phone,
    publicEmail: row.public_email,
    companyLine: row.company_line,
    motto: row.motto,
    configured: Boolean(row.display_name || row.address_line1 || row.phone),
    updatedAt: row.updated_at,
  };
}

export interface ClinicSettingsInput {
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  publicEmail: string;
  companyLine: string;
  motto: string;
}

export function parseClinicSettingsInput(body: Record<string, unknown>): ClinicSettingsInput {
  return {
    displayName: boundedText(body.displayName, 160),
    addressLine1: boundedText(body.addressLine1, 240),
    addressLine2: boundedText(body.addressLine2, 240),
    phone: boundedText(body.phone, 40),
    publicEmail: boundedText(body.publicEmail, 254),
    companyLine: boundedText(body.companyLine, 240),
    motto: boundedText(body.motto, 160),
  };
}

export async function upsertClinicSettings(
  db: D1Database,
  clinicId: string,
  actorUserId: string,
  input: ClinicSettingsInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO clinic_settings
         (clinic_id, display_name, address_line1, address_line2, phone, public_email,
          company_line, motto, updated_by_user_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(clinic_id) DO UPDATE SET
         display_name = excluded.display_name,
         address_line1 = excluded.address_line1,
         address_line2 = excluded.address_line2,
         phone = excluded.phone,
         public_email = excluded.public_email,
         company_line = excluded.company_line,
         motto = excluded.motto,
         updated_by_user_id = excluded.updated_by_user_id,
         updated_at = excluded.updated_at`,
    )
    .bind(
      clinicId,
      input.displayName,
      input.addressLine1,
      input.addressLine2,
      input.phone,
      input.publicEmail,
      input.companyLine,
      input.motto,
      actorUserId,
      now,
    )
    .run();
}
