export interface PatientDatabaseRow {
  id?: unknown;
  name?: unknown;
  birth_date?: unknown;
  guardian_name?: unknown;
  guardian_phone?: unknown;
  diagnosis_code?: unknown;
  notes?: unknown;
  is_demo?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface PatientApiRecord {
  id: string;
  name: string;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  diagnosisCode: string | null;
  notes: string | null;
  isDemo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PatientWriteField =
  | "name"
  | "birth_date"
  | "guardian_name"
  | "guardian_phone"
  | "diagnosis_code"
  | "notes";

export type PatientWriteValues = Partial<
  Record<PatientWriteField, string | null>
>;

export type PatientWriteResult =
  | { ok: true; values: PatientWriteValues }
  | { ok: false; message: string };

interface AliasedValue {
  present: boolean;
  value?: unknown;
}

function aliasedValue(
  body: Record<string, unknown>,
  camelCase: string,
  snakeCase: string,
): AliasedValue {
  if (Object.prototype.hasOwnProperty.call(body, camelCase)) {
    return { present: true, value: body[camelCase] };
  }
  if (Object.prototype.hasOwnProperty.call(body, snakeCase)) {
    return { present: true, value: body[snakeCase] };
  }
  return { present: false };
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeOptionalText(
  value: AliasedValue,
  label: string,
  maxLength: number,
): { ok: true; value?: string | null } | { ok: false; message: string } {
  if (!value.present) return { ok: true };
  if (value.value === null || value.value === "") {
    return { ok: true, value: null };
  }
  if (typeof value.value !== "string") {
    return { ok: false, message: `'${label}' deve ser texto ou nulo.` };
  }
  const normalized = value.value.trim();
  if (normalized.length > maxLength) {
    return {
      ok: false,
      message: `'${label}' deve ter no máximo ${maxLength} caracteres.`,
    };
  }
  return { ok: true, value: normalized || null };
}

/**
 * Aceita o contrato atual da UI (camelCase) e o contrato histórico do D1
 * (snake_case), mas sempre devolve nomes de colunas do banco.
 */
export function normalizePatientWrite(
  body: Record<string, unknown>,
  options: { requireName: boolean },
): PatientWriteResult {
  const values: PatientWriteValues = {};
  const name = aliasedValue(body, "name", "name");

  if (options.requireName && !name.present) {
    return {
      ok: false,
      message: "'name' é obrigatório e deve ter pelo menos 2 caracteres.",
    };
  }
  if (name.present) {
    if (typeof name.value !== "string") {
      return { ok: false, message: "'name' deve ser texto." };
    }
    const normalizedName = name.value.trim();
    if (normalizedName.length < 2 || normalizedName.length > 160) {
      return {
        ok: false,
        message: "'name' deve ter entre 2 e 160 caracteres.",
      };
    }
    values.name = normalizedName;
  }

  const birthDate = aliasedValue(body, "birthDate", "birth_date");
  if (birthDate.present) {
    if (birthDate.value === null || birthDate.value === "") {
      values.birth_date = null;
    } else if (
      typeof birthDate.value !== "string" ||
      !isRealIsoDate(birthDate.value)
    ) {
      return {
        ok: false,
        message: "'birthDate' deve ser uma data válida no formato YYYY-MM-DD.",
      };
    } else {
      const today = new Date().toISOString().slice(0, 10);
      if (birthDate.value > today) {
        return {
          ok: false,
          message: "'birthDate' não pode estar no futuro.",
        };
      }
      values.birth_date = birthDate.value;
    }
  }

  const textFields: Array<{
    camel: string;
    snake: Exclude<PatientWriteField, "name" | "birth_date">;
    max: number;
  }> = [
    { camel: "guardianName", snake: "guardian_name", max: 160 },
    { camel: "guardianPhone", snake: "guardian_phone", max: 40 },
    { camel: "diagnosisCode", snake: "diagnosis_code", max: 80 },
    { camel: "notes", snake: "notes", max: 4_000 },
  ];

  for (const field of textFields) {
    const normalized = normalizeOptionalText(
      aliasedValue(body, field.camel, field.snake),
      field.camel,
      field.max,
    );
    if (!normalized.ok) return normalized;
    if (normalized.value !== undefined) values[field.snake] = normalized.value;
  }

  return { ok: true, values };
}

export function toPatientApi(row: PatientDatabaseRow): PatientApiRecord {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    birthDate: nullableString(row.birth_date),
    guardianName: nullableString(row.guardian_name),
    guardianPhone: nullableString(row.guardian_phone),
    diagnosisCode: nullableString(row.diagnosis_code),
    notes: nullableString(row.notes),
    isDemo: row.is_demo === true || row.is_demo === 1 || row.is_demo === "1",
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  };
}

export function isValidPatientId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
}

export function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
