from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:220]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

# 1) Produção nunca pode reabrir modo demo via flag, mesmo se D1 estiver ausente.
replace_once(
    'functions/api/_middleware.ts',
    '''  const isProductionBeforeAuth = (env.ENVIRONMENT ?? "").toLowerCase() === "production";\n  const demoWritesEnabledBeforeAuth = env.DEMO_API_WRITES_ENABLED === "true";\n  if (\n    isProductionBeforeAuth &&\n    !env.DB &&\n    !demoWritesEnabledBeforeAuth &&\n    !PUBLIC_API_PATHS.has(requestPathBeforeAuth)\n  ) {''',
    '''  const isProductionBeforeAuth = (env.ENVIRONMENT ?? "").toLowerCase() === "production";\n  if (\n    isProductionBeforeAuth &&\n    !env.DB &&\n    !PUBLIC_API_PATHS.has(requestPathBeforeAuth)\n  ) {''',
)

# O segundo guard de escrita vira apenas defesa para ambientes não-prod explicitamente demo.
replace_once(
    'functions/api/_middleware.ts',
    '''  const isProduction = (env.ENVIRONMENT ?? "").toLowerCase() === "production";\n  const demoWritesEnabled = env.DEMO_API_WRITES_ENABLED === "true";\n  const isAuthRoute = new URL(request.url).pathname.startsWith("/api/auth/");\n  if (isProduction && !env.DB && !demoWritesEnabled && !isAuthRoute && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {''',
    '''  const isProduction = (env.ENVIRONMENT ?? "").toLowerCase() === "production";\n  const demoWritesEnabled = env.DEMO_API_WRITES_ENABLED === "true";\n  const isAuthRoute = new URL(request.url).pathname.startsWith("/api/auth/");\n  if (!isProduction && !env.DB && !demoWritesEnabled && !isAuthRoute && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {''',
)

# 2) Cloudflare auth: timestamp de lock inválido falha fechado.
replace_once(
    'functions/api/auth/_shared.ts',
    '''export function isLocked(u: UserRow): boolean {\n  if (!u.locked_until) return false;\n  const until = Date.parse(u.locked_until);\n  return Number.isFinite(until) && until > Date.now();\n}''',
    '''export function isLocked(u: UserRow): boolean {\n  if (!u.locked_until) return false;\n  const until = Date.parse(u.locked_until);\n  // Campo presente porém malformado é estado inseguro: não reinterpretar como\n  // conta desbloqueada. O operador precisa corrigir o dado antes do login.\n  return !Number.isFinite(until) || until > Date.now();\n}''',
)
replace_once(
    'functions/api/auth/_shared.ts',
    '''        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR locked_until <= ?)`,''',
    '''        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR julianday(locked_until) <= julianday(?))`,''',
)

# 3) Cloudflare sessions: expiries inválidos nunca são ativos nem rotacionáveis;
#    conta deve continuar ativa no momento atômico da rotação.
replace_once(
    'functions/api/auth/_sessions.ts',
    '''         FROM users\n        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR locked_until <= ?)`,''',
    '''         FROM users\n        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR julianday(locked_until) <= julianday(?))`,''',
)
replace_once(
    'functions/api/auth/_sessions.ts',
    '''  if (Date.parse(current.expires_at) <= Date.now()) {\n    await revokeSessionFamily(db, current.family_id, user.id, "expired");\n    return { ok: false, code: "INVALID_REFRESH" };\n  }''',
    '''  const currentExpiry = Date.parse(current.expires_at);\n  if (!Number.isFinite(currentExpiry) || currentExpiry <= Date.now()) {\n    await revokeSessionFamily(db, current.family_id, user.id, "expired");\n    return { ok: false, code: "INVALID_REFRESH" };\n  }''',
)
replace_once(
    'functions/api/auth/_sessions.ts',
    '''            AND revoked_at IS NULL AND replaced_by_session_id IS NULL\n            AND expires_at > ?`,''',
    '''            AND revoked_at IS NULL AND replaced_by_session_id IS NULL\n            AND julianday(expires_at) > julianday(?)\n            AND EXISTS (\n              SELECT 1 FROM users u\n               WHERE u.id = auth_refresh_sessions.user_id AND u.is_active = 1\n            )`,''',
)
replace_once(
    'functions/api/auth/_sessions.ts',
    '''        WHERE family_id = ? AND user_id = ? AND revoked_at IS NULL\n          AND expires_at > ?\n        LIMIT 1`,''',
    '''        WHERE family_id = ? AND user_id = ? AND revoked_at IS NULL\n          AND julianday(expires_at) > julianday(?)\n        LIMIT 1`,''',
)

# 4) Express lockout/expiry também falham fechado com timestamp malformado.
replace_once(
    'server/lib/password.ts',
    '''export function isAccountLocked(lockedUntil: string | null | undefined): boolean {\n  if (!lockedUntil) return false;\n  return new Date(lockedUntil).getTime() > Date.now();\n}''',
    '''export function isAccountLocked(lockedUntil: string | null | undefined): boolean {\n  if (!lockedUntil) return false;\n  const until = Date.parse(lockedUntil);\n  return !Number.isFinite(until) || until > Date.now();\n}\n\nexport function isExpiredOrInvalidTimestamp(value: string): boolean {\n  const timestamp = Date.parse(value);\n  return !Number.isFinite(timestamp) || timestamp <= Date.now();\n}''',
)
replace_once(
    'server/auth/routes.ts',
    'import { DUMMY_BCRYPT_HASH, PASSWORD_POLICY, hashPassword, verifyPassword, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";',
    'import { DUMMY_BCRYPT_HASH, PASSWORD_POLICY, hashPassword, verifyPassword, calculateLockoutUntil, isAccountLocked, isExpiredOrInvalidTimestamp } from "../lib/password.js";',
)
# SQL temporal fail-closed em login concorrente.
s = (ROOT / 'server/auth/routes.ts').read_text('utf-8')
s = s.replace(
    'or(isNull(users.lockedUntil), lte(users.lockedUntil, now))',
    'or(isNull(users.lockedUntil), sql`julianday(${users.lockedUntil}) <= julianday(${now})`)',
)
# lte fica sem uso após as duas substituições esperadas.
s = s.replace('import { eq, and, isNull, lte, or, sql } from "drizzle-orm";', 'import { eq, and, isNull, or, sql } from "drizzle-orm";')
(ROOT / 'server/auth/routes.ts').write_text(s, 'utf-8')

replace_once(
    'server/auth/routes.ts',
    '''      if (new Date(stored.expiresAt).getTime() < Date.now()) {\n        return res.status(401).json({ error: "Refresh token expirado", code: "REFRESH_EXPIRED" });\n      }''',
    '''      if (isExpiredOrInvalidTimestamp(stored.expiresAt)) {\n        return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });\n      }''',
)
replace_once(
    'server/auth/routes.ts',
    '''          if (!current || current.tokenHash !== tokenHash || new Date(current.expiresAt).getTime() < Date.now()) {\n            throw new Error("REFRESH_RACE");\n          }''',
    '''          if (!current || current.tokenHash !== tokenHash || isExpiredOrInvalidTimestamp(current.expiresAt)) {\n            throw new Error("REFRESH_RACE");\n          }''',
)

# 5) Testes permanentes para não reabrir os bypasses temporais/demo.
p = ROOT / 'tests/unit/cloudflare-auth-middleware.test.ts'
s = p.read_text('utf-8')
anchor = '''assert.equal(\n  (await call("/api/patients", { ENVIRONMENT: "production" })).status,\n  503,\n  "produção sem D1 falha fechada também em leitura protegida",\n);\n'''
addition = anchor + '''assert.equal(\n  (await call("/api/patients", {\n    ENVIRONMENT: "production",\n    DEMO_API_WRITES_ENABLED: "true",\n  })).status,\n  503,\n  "flag demo jamais pode reabrir rota protegida em produção sem D1",\n);\n'''
if s.count(anchor) != 1:
    raise SystemExit('middleware prod guard test anchor missing')
p.write_text(s.replace(anchor, addition, 1), 'utf-8')

(ROOT / 'tests/unit/auth-time-failclosed.test.ts').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport { isLocked, type UserRow } from "../../functions/api/auth/_shared";\nimport { isAccountLocked, isExpiredOrInvalidTimestamp } from "../../server/lib/password";\n\nconst user: UserRow = {\n  id: "u", name: "U", email: "u@example.com", role: "professional", is_active: 1,\n  password_hash: "x", must_change_password: 0, failed_login_attempts: 0, locked_until: "nao-e-data",\n};\nassert.equal(isLocked(user), true, "lock D1 malformado deve falhar fechado");\nassert.equal(isAccountLocked("nao-e-data"), true, "lock Express malformado deve falhar fechado");\nassert.equal(isExpiredOrInvalidTimestamp("nao-e-data"), true);\nassert.equal(isExpiredOrInvalidTimestamp("2000-01-01T00:00:00.000Z"), true);\nassert.equal(isExpiredOrInvalidTimestamp("2999-01-01T00:00:00.000Z"), false);\n\nconst sessions = fs.readFileSync("functions/api/auth/_sessions.ts", "utf8");\nassert.match(sessions, /!Number\\.isFinite\\(currentExpiry\\)/);\nassert.match(sessions, /julianday\\(expires_at\\) > julianday\\(\\?\\)/);\nassert.match(sessions, /EXISTS \\([\\s\\S]{0,300}FROM users u[\\s\\S]{0,300}u\\.is_active = 1/);\nassert.match(sessions, /SELECT 1 AS active[\\s\\S]{0,300}julianday\\(expires_at\\)/);\n\nconst expressAuth = fs.readFileSync("server/auth/routes.ts", "utf8");\nassert.match(expressAuth, /isExpiredOrInvalidTimestamp\\(stored\\.expiresAt\\)/);\nassert.match(expressAuth, /isExpiredOrInvalidTimestamp\\(current\\.expiresAt\\)/);\nassert.doesNotMatch(expressAuth, /new Date\\((?:stored|current)\\.expiresAt\\)\\.getTime\\(\\)/);\n\nconsole.log("✓ auth temporal: locks/expiries malformados e sessão de conta desativada falham fechado");\n''', 'utf-8')

# Acrescenta ao gate rápido.
p = ROOT / 'package.json'
s = p.read_text('utf-8')
old = '"test:quick-wins": "node --import tsx tests/unit/runtime-config.test.ts &&'
new = '"test:quick-wins": "node --import tsx tests/unit/auth-time-failclosed.test.ts && node --import tsx tests/unit/runtime-config.test.ts &&'
if old not in s:
    raise SystemExit('quick-wins round3 anchor missing')
p.write_text(s.replace(old, new, 1), 'utf-8')

print('Round 3 definitive fixes applied')
