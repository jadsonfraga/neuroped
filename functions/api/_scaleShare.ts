import { randomAccessToken, sha256 } from "./operations/_core";

export const MAX_SHARED_SCALES = 8;
export const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export interface ScaleShareScale {
  id: string;
  name: string;
  fullName?: string;
}

export interface ScaleShareRow {
  id: string;
  patient_id: string;
  created_by_user_id: string | null;
  token_hash: string;
  selected_scales: string;
  status: "pending" | "submitted" | "revoked";
  expires_at: string;
  submitted_at: string | null;
  respondent_name: string | null;
  result_ids: string | null;
  created_at: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function ensureScaleShareSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS scale_share_sessions_demo (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
        created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        token_hash TEXT UNIQUE NOT NULL,
        selected_scales TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','revoked')),
        expires_at DATETIME NOT NULL,
        submitted_at DATETIME,
        respondent_name TEXT,
        result_ids TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_scale_share_sessions_demo_patient ON scale_share_sessions_demo(patient_id)",
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_scale_share_sessions_demo_token ON scale_share_sessions_demo(token_hash)",
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_scale_share_sessions_demo_status ON scale_share_sessions_demo(status)",
    ),
  ]);
}

export function parseScales(
  value: string | null | undefined,
): ScaleShareScale[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
      const name =
        typeof candidate.name === "string" ? candidate.name.trim() : "";
      const fullName =
        typeof candidate.fullName === "string"
          ? candidate.fullName.trim()
          : undefined;
      if (!id || !name || seen.has(id)) return [];
      seen.add(id);
      return [{ id, name, ...(fullName ? { fullName } : {}) }];
    });
  } catch {
    return [];
  }
}

export function normalizeShareScales(value: unknown): ScaleShareScale[] | null {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_SHARED_SCALES
  )
    return null;
  const seen = new Set<string>();
  const scales: ScaleShareScale[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string")
      return null;
    const id = candidate.id.trim();
    const name = candidate.name.trim();
    const fullName =
      typeof candidate.fullName === "string" ? candidate.fullName.trim() : "";
    if (
      !id ||
      id.length > 128 ||
      !name ||
      name.length > 300 ||
      fullName.length > 500 ||
      seen.has(id)
    )
      return null;
    seen.add(id);
    scales.push({ id, name, ...(fullName ? { fullName } : {}) });
  }
  return scales;
}

export function presentShare(
  row: ScaleShareRow,
  scales = parseScales(row.selected_scales),
) {
  return {
    shareId: row.id,
    status: row.status,
    scales,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
  };
}

export function tokenHash(token: string): Promise<string> {
  return sha256(token);
}

export { randomAccessToken };
