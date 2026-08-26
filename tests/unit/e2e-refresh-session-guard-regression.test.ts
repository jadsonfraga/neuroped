import assert from "node:assert/strict";
import { onRequestPost } from "../../functions/api/auth/refresh";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import type { UserRow } from "../../functions/api/auth/_shared";

/**
 * Regressão do P1: um refresh token emitido para uma identidade que hoje colide
 * com NEUROPED_E2E_EMAIL não pode continuar rotacionando e emitindo acesso se
 * essa identidade não satisfaz o contrato da sentinela (role `reader`, zero
 * clinic_memberships) — mesmo que a família tenha sido criada antes da reserva
 * existir. O caminho precisa falhar fechado no próprio refresh, sem depender
 * apenas do bloqueio no login.
 */

interface Session {
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

function createFakeD1() {
  const users = new Map<string, UserRow>();
  const memberships = new Set<string>();
  const sessions = new Map<string, Session>();

  function prepare(sql: string) {
    let values: unknown[] = [];
    const statement = {
      bind(...binds: unknown[]) {
        values = binds;
        return statement;
      },
      async first<T>() {
        if (sql.includes("FROM users") && sql.includes("WHERE id = ?")) {
          return (users.get(String(values[0])) ?? null) as T | null;
        }
        if (sql.includes("FROM clinic_memberships")) {
          return (memberships.has(String(values[0])) ? { has_membership: 1 } : null) as T | null;
        }
        if (sql.includes("FROM auth_refresh_sessions") && sql.includes("WHERE id = ?")) {
          return (sessions.get(String(values[0])) ?? null) as T | null;
        }
        throw new Error(`SELECT não suportado no fake: ${sql}`);
      },
      async run() {
        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("SELECT ?, id, ?, ?")) {
          const [id, familyId, tokenHash, expiresAt, , userId] = values.map(String);
          const user = users.get(userId);
          if (!user || !user.is_active) return { meta: { changes: 0 } };
          sessions.set(id, {
            id,
            user_id: userId,
            family_id: familyId,
            token_hash: tokenHash,
            parent_session_id: null,
            replaced_by_session_id: null,
            expires_at: expiresAt,
            revoked_at: null,
            revoke_reason: null,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("WHERE family_id = ?") && sql.includes("revoke_reason = ?")) {
          const [now, reason, familyId, userId] = values.map(String);
          let changes = 0;
          for (const session of sessions.values()) {
            if (session.family_id === familyId && session.user_id === userId && !session.revoked_at) {
              session.revoked_at = now;
              session.revoke_reason = reason;
              changes += 1;
            }
          }
          return { meta: { changes } };
        }
        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("SELECT ?, user_id")) {
          const [nextId, nextHash, , currentId, userId, familyId, rawHash, cutoff] =
            values.map(String);
          const current = sessions.get(currentId);
          const activeUser = users.get(userId);
          if (
            !current ||
            !activeUser ||
            !activeUser.is_active ||
            current.user_id !== userId ||
            current.family_id !== familyId ||
            current.token_hash !== rawHash ||
            current.revoked_at ||
            current.replaced_by_session_id ||
            current.expires_at <= cutoff
          ) {
            return { meta: { changes: 0 } };
          }
          sessions.set(nextId, {
            id: nextId,
            user_id: current.user_id,
            family_id: current.family_id,
            token_hash: nextHash,
            parent_session_id: current.id,
            replaced_by_session_id: null,
            expires_at: current.expires_at,
            revoked_at: null,
            revoke_reason: null,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("revoke_reason = 'rotated'")) {
          const [now, nextId, , currentId, rawHash] = values.map(String);
          const current = sessions.get(currentId);
          const next = sessions.get(nextId);
          if (!current || !next || current.revoked_at || current.token_hash !== rawHash) {
            return { meta: { changes: 0 } };
          }
          current.revoked_at = now;
          current.revoke_reason = "rotated";
          current.replaced_by_session_id = nextId;
          return { meta: { changes: 1 } };
        }
        throw new Error(`RUN não suportado no fake: ${sql}`);
      },
    };
    return statement;
  }

  async function batch(statements: Array<{ run: () => Promise<unknown> }>) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }

  return { users, memberships, sessions, prepare, batch };
}

type FakeD1 = ReturnType<typeof createFakeD1>;

const secret = "segredo-de-refresh-com-pelo-menos-trinta-e-dois-caracteres";
const e2eEmail = "e2e@example.com";

function userRow(overrides: Partial<UserRow>): UserRow {
  return {
    id: "user-id",
    name: "Usuário",
    email: "usuario@example.com",
    role: "professional",
    is_active: 1,
    password_hash: "hash",
    must_change_password: 0,
    failed_login_attempts: 0,
    locked_until: null,
    ...overrides,
  };
}

function requestFor(refreshToken: string): Request {
  return {
    async json() {
      return { refreshToken };
    },
  } as unknown as Request;
}

async function callRefresh(
  db: FakeD1,
  refreshToken: string,
  envOverrides: Record<string, string> = {},
) {
  const env = {
    DB: db as never,
    NEUROPED_JWT_SECRET: secret,
    ...envOverrides,
  };
  return onRequestPost({
    request: requestFor(refreshToken),
    env,
  } as never);
}

// 1) Usuário comum, não-E2E: refresh continua funcionando normalmente mesmo
//    com NEUROPED_E2E_EMAIL configurado para outra identidade.
{
  const db = createFakeD1();
  const user = userRow({ id: "human-1", email: "humano@example.com", role: "professional" });
  db.users.set(user.id, user);
  const initial = await createSessionTokens(db as never, user, secret);

  const response = await callRefresh(db, initial.refreshToken, { NEUROPED_E2E_EMAIL: e2eEmail });
  assert.equal(response.status, 200, "refresh humano não-E2E deve continuar funcionando");
  const body = await response.json();
  assert.ok(body.accessToken && body.refreshToken, "refresh deve emitir novo par de tokens");
}

// 2) Sentinela válida (role reader, zero clinic_memberships): refresh continua
//    funcionando para a identidade técnica legítima.
{
  const db = createFakeD1();
  const sentinel = userRow({ id: "e2e-1", email: e2eEmail, role: "reader" });
  db.users.set(sentinel.id, sentinel);
  const initial = await createSessionTokens(db as never, sentinel, secret);

  const response = await callRefresh(db, initial.refreshToken, { NEUROPED_E2E_EMAIL: e2eEmail });
  assert.equal(response.status, 200, "refresh da sentinela válida deve continuar funcionando");
}

// 3) Identidade que colide com NEUROPED_E2E_EMAIL e possui clinic_membership:
//    a família pode ter sido emitida ANTES da reserva existir — o refresh deve
//    falhar fechado, zero tokens novos, e a família deve ser revogada.
{
  const db = createFakeD1();
  const humanWithMembership = userRow({ id: "human-2", email: e2eEmail, role: "reader" });
  db.users.set(humanWithMembership.id, humanWithMembership);
  db.memberships.add(humanWithMembership.id);
  // Sessão criada quando esse e-mail ainda não era a identidade reservada.
  const initial = await createSessionTokens(db as never, humanWithMembership, secret);

  const response = await callRefresh(db, initial.refreshToken, { NEUROPED_E2E_EMAIL: e2eEmail });
  assert.equal(response.status, 401, "refresh deve falhar fechado para membership colidindo com E2E");
  const body = await response.json();
  assert.equal(body.code, "INVALID_SESSION");

  const family = [...db.sessions.values()].filter(
    (s) => s.user_id === humanWithMembership.id,
  );
  assert.ok(
    family.every((s) => s.revoked_at && s.revoke_reason === "account_disabled"),
    "a família pré-existente deve ser revogada, não apenas rejeitada nesta chamada",
  );

  // Uma segunda tentativa com o mesmo token (ou qualquer descendente) continua 401.
  const retry = await callRefresh(db, initial.refreshToken, { NEUROPED_E2E_EMAIL: e2eEmail });
  assert.equal(retry.status, 401);
}

// 4) Identidade que colide com NEUROPED_E2E_EMAIL mas tem role incompatível
//    (ex.: admin humano usando o mesmo e-mail): falha fechado igualmente.
{
  const db = createFakeD1();
  const humanAdmin = userRow({ id: "human-3", email: e2eEmail, role: "admin" });
  db.users.set(humanAdmin.id, humanAdmin);
  const initial = await createSessionTokens(db as never, humanAdmin, secret);

  const response = await callRefresh(db, initial.refreshToken, { NEUROPED_E2E_EMAIL: e2eEmail });
  assert.equal(response.status, 401, "role incompatível com a sentinela deve falhar fechado");
  const family = [...db.sessions.values()].filter((s) => s.user_id === humanAdmin.id);
  assert.ok(family.every((s) => s.revoked_at), "a família deve ser revogada");
}

// 5) Sem NEUROPED_E2E_EMAIL configurado, nenhum comportamento muda (nenhuma
//    regressão para deploys que ainda não definem a identidade reservada).
{
  const db = createFakeD1();
  const user = userRow({ id: "human-4", email: "outro@example.com", role: "professional" });
  db.users.set(user.id, user);
  const initial = await createSessionTokens(db as never, user, secret);

  const response = await callRefresh(db, initial.refreshToken, {});
  assert.equal(response.status, 200, "sem E2E configurado, refresh normal não deve ser afetado");
}

console.log(
  "✓ refresh fecha a reserva de identidade E2E também para famílias de sessão pré-existentes",
);
