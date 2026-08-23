import { sha256Hex, signJwt } from "./_crypto";
import { ACCESS_TTL, REFRESH_TTL, type UserRow } from "./_shared";
import type { SessionTokens } from "./_sessions";

export interface PreparedPasswordChangeSession {
  tokens: SessionTokens;
  insertStatement: D1PreparedStatement;
  refreshId: string;
}

/**
 * Prepara tokens e o INSERT da nova família sem executar I/O no D1.
 *
 * O caller inclui este statement no mesmo db.batch() que troca a senha e revoga
 * as famílias antigas. O INSERT só acontece se o hash novo já estiver aplicado,
 * eliminando a janela em que tokens antigos sobreviveriam à troca de senha.
 */
export async function preparePasswordChangeSession(
  db: D1Database,
  user: UserRow,
  secret: string,
  expectedNewPasswordHash: string,
): Promise<PreparedPasswordChangeSession> {
  const familyId = crypto.randomUUID();
  const refreshId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000).toISOString();
  const claims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = await signJwt(
    { ...claims, type: "access", sid: familyId },
    secret,
    ACCESS_TTL,
  );
  const refreshToken = await signJwt(
    { ...claims, type: "refresh", sid: familyId, jti: refreshId },
    secret,
    REFRESH_TTL,
  );
  const refreshHash = await sha256Hex(refreshToken);

  const insertStatement = db
    .prepare(
      `INSERT INTO auth_refresh_sessions
         (id, user_id, family_id, token_hash, parent_session_id,
          replaced_by_session_id, expires_at, revoked_at, revoke_reason,
          created_at, last_used_at)
       SELECT ?, id, ?, ?, NULL, NULL, ?, NULL, NULL, ?, NULL
         FROM users
        WHERE id = ? AND is_active = 1 AND password_hash = ?
          AND (locked_until IS NULL OR julianday(locked_until) <= julianday(?))`,
    )
    .bind(
      refreshId,
      familyId,
      refreshHash,
      expiresAt,
      now.toISOString(),
      user.id,
      expectedNewPasswordHash,
      now.toISOString(),
    );

  return {
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TTL,
      sessionId: familyId,
    },
    insertStatement,
    refreshId,
  };
}
