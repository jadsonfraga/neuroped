/**
 * Sessões revogáveis sobre D1.
 *
 * Cada login cria uma família (`sid`). Cada refresh possui um `jti` próprio e
 * só seu SHA-256 é persistido. A rotação consome o token atual e cria o próximo
 * de forma transacional via D1 batch. Reutilizar um token consumido revoga toda
 * a família, inclusive o token mais novo potencialmente roubado.
 */
import type { JwtPayload } from "./_crypto";
import { sha256Hex, signJwt } from "./_crypto";
import {
  ACCESS_TTL,
  REFRESH_TTL,
  type UserRow,
} from "./_shared";

export interface RefreshSessionRow {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  parent_session_id: string | null;
  replaced_by_session_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export interface RotationFailure {
  ok: false;
  code: "INVALID_REFRESH" | "REFRESH_REUSE_DETECTED";
}

export interface RotationSuccess {
  ok: true;
  tokens: SessionTokens;
}

export type RotationResult = RotationFailure | RotationSuccess;

function claimsFor(user: UserRow) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function secondsUntil(expiresAt: string): number {
  return Math.max(1, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
}

async function signSessionTokens(
  user: UserRow,
  secret: string,
  familyId: string,
  refreshId: string,
  refreshExpiresAt: string,
): Promise<SessionTokens & { refreshHash: string }> {
  const claims = claimsFor(user);
  const accessToken = await signJwt(
    { ...claims, type: "access", sid: familyId },
    secret,
    ACCESS_TTL,
  );
  const refreshToken = await signJwt(
    { ...claims, type: "refresh", sid: familyId, jti: refreshId },
    secret,
    Math.min(REFRESH_TTL, secondsUntil(refreshExpiresAt)),
  );
  return {
    accessToken,
    refreshToken,
    refreshHash: await sha256Hex(refreshToken),
    expiresIn: ACCESS_TTL,
    sessionId: familyId,
  };
}

export async function createSessionTokens(
  db: D1Database,
  user: UserRow,
  secret: string,
): Promise<SessionTokens> {
  const now = new Date();
  const familyId = crypto.randomUUID();
  const refreshId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000).toISOString();
  const tokens = await signSessionTokens(
    user,
    secret,
    familyId,
    refreshId,
    expiresAt,
  );

  const inserted = await db
    .prepare(
      `INSERT INTO auth_refresh_sessions
         (id, user_id, family_id, token_hash, parent_session_id,
          replaced_by_session_id, expires_at, revoked_at, revoke_reason,
          created_at, last_used_at)
       SELECT ?, id, ?, ?, NULL, NULL, ?, NULL, NULL, ?, NULL
         FROM users
        WHERE id = ? AND is_active = 1
          AND (locked_until IS NULL OR locked_until <= ?)`,
    )
    .bind(
      refreshId,
      familyId,
      tokens.refreshHash,
      expiresAt,
      now.toISOString(),
      user.id,
      now.toISOString(),
    )
    .run();
  if ((inserted.meta?.changes ?? 0) !== 1) {
    throw new Error("AUTH_USER_STATE_CHANGED");
  }

  const { refreshHash: _refreshHash, ...publicTokens } = tokens;
  return publicTokens;
}

async function findRefreshSession(
  db: D1Database,
  refreshId: string,
): Promise<RefreshSessionRow | null> {
  return db
    .prepare(
      `SELECT id, user_id, family_id, token_hash, parent_session_id,
              replaced_by_session_id, expires_at, revoked_at, revoke_reason
         FROM auth_refresh_sessions
        WHERE id = ?
        LIMIT 1`,
    )
    .bind(refreshId)
    .first<RefreshSessionRow>();
}

export async function revokeSessionFamily(
  db: D1Database,
  familyId: string,
  userId: string,
  reason: "logout" | "reuse_detected" | "account_disabled" | "expired",
): Promise<void> {
  await db
    .prepare(
      `UPDATE auth_refresh_sessions
          SET revoked_at = ?, revoke_reason = ?
        WHERE family_id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .bind(new Date().toISOString(), reason, familyId, userId)
    .run();
}

function hasSessionClaims(
  payload: JwtPayload,
): payload is JwtPayload & { sid: string; jti: string } {
  return (
    payload.type === "refresh" &&
    typeof payload.sid === "string" &&
    payload.sid.length > 0 &&
    typeof payload.jti === "string" &&
    payload.jti.length > 0
  );
}

export async function rotateRefreshSession(
  db: D1Database,
  user: UserRow,
  secret: string,
  payload: JwtPayload,
  rawToken: string,
): Promise<RotationResult> {
  if (!hasSessionClaims(payload) || payload.sub !== user.id) {
    return { ok: false, code: "INVALID_REFRESH" };
  }

  const current = await findRefreshSession(db, payload.jti);
  const rawHash = await sha256Hex(rawToken);
  if (
    !current ||
    current.user_id !== user.id ||
    current.family_id !== payload.sid ||
    current.token_hash !== rawHash
  ) {
    return { ok: false, code: "INVALID_REFRESH" };
  }

  if (current.revoked_at || current.replaced_by_session_id) {
    await revokeSessionFamily(db, current.family_id, user.id, "reuse_detected");
    return { ok: false, code: "REFRESH_REUSE_DETECTED" };
  }
  if (Date.parse(current.expires_at) <= Date.now()) {
    await revokeSessionFamily(db, current.family_id, user.id, "expired");
    return { ok: false, code: "INVALID_REFRESH" };
  }

  const nextId = crypto.randomUUID();
  const now = new Date().toISOString();
  const next = await signSessionTokens(
    user,
    secret,
    current.family_id,
    nextId,
    current.expires_at,
  );

  // O INSERT condicional consome apenas uma sessão ainda ativa. D1 batch é
  // transacional; uma segunda requisição concorrente não consegue criar outro
  // descendente do mesmo refresh.
  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO auth_refresh_sessions
           (id, user_id, family_id, token_hash, parent_session_id,
            replaced_by_session_id, expires_at, revoked_at, revoke_reason,
            created_at, last_used_at)
         SELECT ?, user_id, family_id, ?, id, NULL, expires_at, NULL, NULL, ?, NULL
           FROM auth_refresh_sessions
          WHERE id = ? AND user_id = ? AND family_id = ? AND token_hash = ?
            AND revoked_at IS NULL AND replaced_by_session_id IS NULL
            AND expires_at > ?`,
      )
      .bind(
        nextId,
        next.refreshHash,
        now,
        current.id,
        user.id,
        current.family_id,
        rawHash,
        now,
      ),
    db
      .prepare(
        `UPDATE auth_refresh_sessions
            SET revoked_at = ?, revoke_reason = 'rotated',
                replaced_by_session_id = ?, last_used_at = ?
          WHERE id = ? AND token_hash = ? AND revoked_at IS NULL
            AND replaced_by_session_id IS NULL
            AND EXISTS (
              SELECT 1 FROM auth_refresh_sessions next
               WHERE next.id = ? AND next.parent_session_id = ?
            )`,
      )
      .bind(now, nextId, now, current.id, rawHash, nextId, current.id),
  ]);

  if (!(results[0]?.meta?.changes ?? 0) || !(results[1]?.meta?.changes ?? 0)) {
    await revokeSessionFamily(db, current.family_id, user.id, "reuse_detected");
    return { ok: false, code: "REFRESH_REUSE_DETECTED" };
  }

  const { refreshHash: _refreshHash, ...publicTokens } = next;
  return { ok: true, tokens: publicTokens };
}

export async function revokeRefreshToken(
  db: D1Database,
  payload: JwtPayload,
  rawToken: string,
  reason: "logout" | "account_disabled" = "logout",
): Promise<boolean> {
  if (!hasSessionClaims(payload)) return false;
  const session = await findRefreshSession(db, payload.jti);
  if (
    !session ||
    session.user_id !== payload.sub ||
    session.family_id !== payload.sid ||
    session.token_hash !== (await sha256Hex(rawToken))
  ) {
    return false;
  }
  await revokeSessionFamily(db, session.family_id, session.user_id, reason);
  return true;
}

/** Access tokens também falham imediatamente após logout/reuse detection. */
export async function isSessionFamilyActive(
  db: D1Database,
  userId: string,
  familyId: string | undefined,
): Promise<boolean> {
  if (!familyId) return false;
  const row = await db
    .prepare(
      `SELECT 1 AS active
         FROM auth_refresh_sessions
        WHERE family_id = ? AND user_id = ? AND revoked_at IS NULL
          AND expires_at > ?
        LIMIT 1`,
    )
    .bind(familyId, userId, new Date().toISOString())
    .first<{ active: number }>();
  return row?.active === 1;
}
