import assert from "node:assert/strict";
import { verifyJwt } from "../../functions/api/auth/_crypto";
import {
  createSessionTokens,
  isSessionFamilyActive,
  revokeRefreshToken,
  rotateRefreshSession,
  type RefreshSessionRow,
} from "../../functions/api/auth/_sessions";
import type { UserRow } from "../../functions/api/auth/_shared";

interface TestSession extends RefreshSessionRow {
  created_at: string;
  last_used_at: string | null;
}

class FakeSessionD1 {
  readonly sessions = new Map<string, TestSession>();
  readonly memberships = new Set<string>();

  prepare(sql: string) {
    let values: unknown[] = [];
    const statement = {
      bind: (...binds: unknown[]) => {
        values = binds;
        return statement;
      },
      first: async <T>() => {
        if (sql.includes("WHERE id = ?") && sql.includes("FROM auth_refresh_sessions")) {
          return (this.sessions.get(String(values[0])) ?? null) as T | null;
        }
        if (sql.includes("SELECT 1 AS active")) {
          const [familyId, userId, now] = values.map(String);
          const active = [...this.sessions.values()].some(
            (session) =>
              session.family_id === familyId &&
              session.user_id === userId &&
              !session.revoked_at &&
              session.expires_at > now,
          );
          return (active ? { active: 1 } : null) as T | null;
        }
        throw new Error(`SELECT não suportado no fake: ${sql}`);
      },
      run: async () => {
        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("SELECT ?, id, ?, ?")) {
          const [id, familyId, tokenHash, expiresAt, createdAt, userId] = values.map(String);
          if (sql.includes("clinic_memberships") && this.memberships.has(userId)) {
            return { meta: { changes: 0 } };
          }
          this.sessions.set(id, {
            id,
            user_id: userId,
            family_id: familyId,
            token_hash: tokenHash,
            parent_session_id: null,
            replaced_by_session_id: null,
            expires_at: expiresAt,
            revoked_at: null,
            revoke_reason: null,
            created_at: createdAt,
            last_used_at: null,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("VALUES (?, ?, ?, ?")) {
          const [id, userId, familyId, tokenHash, expiresAt, createdAt] = values.map(String);
          this.sessions.set(id, {
            id,
            user_id: userId,
            family_id: familyId,
            token_hash: tokenHash,
            parent_session_id: null,
            replaced_by_session_id: null,
            expires_at: expiresAt,
            revoked_at: null,
            revoke_reason: null,
            created_at: createdAt,
            last_used_at: null,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("SELECT ?, user_id")) {
          const [nextId, nextHash, now, currentId, userId, familyId, rawHash, cutoff] = values.map(String);
          const current = this.sessions.get(currentId);
          if (
            !current ||
            current.user_id !== userId ||
            current.family_id !== familyId ||
            current.token_hash !== rawHash ||
            current.revoked_at ||
            current.replaced_by_session_id ||
            current.expires_at <= cutoff
          ) {
            return { meta: { changes: 0 } };
          }
          this.sessions.set(nextId, {
            id: nextId,
            user_id: current.user_id,
            family_id: current.family_id,
            token_hash: nextHash,
            parent_session_id: current.id,
            replaced_by_session_id: null,
            expires_at: current.expires_at,
            revoked_at: null,
            revoke_reason: null,
            created_at: now,
            last_used_at: null,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("revoke_reason = 'rotated'")) {
          const [now, nextId, lastUsedAt, currentId, rawHash] = values.map(String);
          const current = this.sessions.get(currentId);
          const next = this.sessions.get(nextId);
          if (!current || !next || current.revoked_at || current.token_hash !== rawHash) {
            return { meta: { changes: 0 } };
          }
          current.revoked_at = now;
          current.revoke_reason = "rotated";
          current.replaced_by_session_id = nextId;
          current.last_used_at = lastUsedAt;
          return { meta: { changes: 1 } };
        }
        if (sql.includes("WHERE family_id = ?") && sql.includes("revoke_reason = ?")) {
          const [now, reason, familyId, userId] = values.map(String);
          let changes = 0;
          for (const session of this.sessions.values()) {
            if (
              session.family_id === familyId &&
              session.user_id === userId &&
              !session.revoked_at
            ) {
              session.revoked_at = now;
              session.revoke_reason = reason;
              changes += 1;
            }
          }
          return { meta: { changes } };
        }
        throw new Error(`RUN não suportado no fake: ${sql}`);
      },
    };
    return statement;
  }

  async batch(statements: Array<{ run: () => Promise<unknown> }>) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }
}

const secret = "segredo-de-sessao-com-pelo-menos-trinta-e-dois-caracteres";
const user: UserRow = {
  id: "user-session",
  name: "Usuário",
  email: "usuario@example.com",
  role: "professional",
  is_active: 1,
  password_hash: "hash",
  must_change_password: 0,
  failed_login_attempts: 0,
  locked_until: null,
};
const db = new FakeSessionD1();

const initial = await createSessionTokens(db as never, user, secret);
const initialRefresh = await verifyJwt(initial.refreshToken, secret);
const initialAccess = await verifyJwt(initial.accessToken, secret);
assert.equal(initialRefresh?.type, "refresh");
assert.ok(initialRefresh?.sid && initialRefresh.jti);
assert.equal(initialAccess?.sid, initialRefresh?.sid);
assert.equal(initialAccess?.jti, undefined);
const storedInitial = db.sessions.get(initialRefresh!.jti!);
assert.equal(storedInitial?.token_hash.length, 64);
assert.notEqual(storedInitial?.token_hash, initial.refreshToken, "D1 nunca persiste token em claro");
assert.equal(
  await isSessionFamilyActive(db as never, user.id, initialRefresh?.sid),
  true,
);

const rotated = await rotateRefreshSession(
  db as never,
  user,
  secret,
  initialRefresh!,
  initial.refreshToken,
);
assert.equal(rotated.ok, true);
assert.equal(storedInitial?.revoke_reason, "rotated");
assert.ok(storedInitial?.replaced_by_session_id);
const nextRefreshToken = rotated.ok ? rotated.tokens.refreshToken : "";
const nextPayload = await verifyJwt(nextRefreshToken, secret);
assert.equal(nextPayload?.sid, initialRefresh?.sid, "rotação preserva família");
assert.notEqual(nextPayload?.jti, initialRefresh?.jti, "rotação usa jti novo");

const replay = await rotateRefreshSession(
  db as never,
  user,
  secret,
  initialRefresh!,
  initial.refreshToken,
);
assert.deepEqual(replay, { ok: false, code: "REFRESH_REUSE_DETECTED" });
assert.equal(
  await isSessionFamilyActive(db as never, user.id, initialRefresh?.sid),
  false,
  "reuse revoga também o descendente atual",
);

const logoutSession = await createSessionTokens(db as never, user, secret);
const logoutPayload = await verifyJwt(logoutSession.refreshToken, secret);
assert.equal(
  await revokeRefreshToken(
    db as never,
    logoutPayload!,
    logoutSession.refreshToken,
    "logout",
  ),
  true,
);
assert.equal(
  await isSessionFamilyActive(db as never, user.id, logoutPayload?.sid),
  false,
  "logout invalida access e refresh da família imediatamente",
);

// requireNoClinicMembership embute a ausência de clinic_membership na própria
// SQL que emite a sessão inicial (usada pelo login da identidade E2E
// reservada). Sem membership, a emissão continua funcionando; com uma
// membership presente no momento do INSERT, a guarda zera as linhas
// afetadas e createSessionTokens falha fechado em vez de emitir tokens.
const membershipDb = new FakeSessionD1();
const sentinel: UserRow = { ...user, id: "sentinel-1", role: "reader" };

await createSessionTokens(membershipDb as never, sentinel, secret, {
  requireNoClinicMembership: true,
});
assert.equal(
  [...membershipDb.sessions.values()].filter((s) => s.user_id === sentinel.id).length,
  1,
  "sem membership, a emissão da sessão E2E continua funcionando",
);

membershipDb.memberships.add(sentinel.id);
await assert.rejects(
  createSessionTokens(membershipDb as never, sentinel, secret, {
    requireNoClinicMembership: true,
  }),
  /AUTH_USER_STATE_CHANGED/,
  "membership presente no momento do INSERT deve falhar fechado sem emitir tokens",
);
assert.equal(
  [...membershipDb.sessions.values()].filter((s) => s.user_id === sentinel.id).length,
  1,
  "nenhuma sessão nova deve ter sido criada quando a guarda falha",
);

console.log("✓ refresh sessions rotacionam, detectam reuse e revogam logout");
