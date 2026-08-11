from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'pattern not found in {path}: {old[:120]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'pattern not unique in {path}: count={text.count(old)}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, repl, flags=0):
    text = read(path)
    new_text, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'regex count={count} in {path}: {pattern[:120]!r}')
    write(path, new_text)


# 1) Cloudflare middleware: private APIs always fail closed without D1;
#    rate limiting uses local hard cap + provisioned KV as shared best-effort layer.
replace_once(
    'functions/api/_middleware.ts',
    '''async function authorizeClinicalApi(request: Request, env: Env): Promise<AuthorizationResult> {\n  if (!env.DB) return { failure: null, user: null };\n  const path = new URL(request.url).pathname.replace(/\\/+$/, "") || "/";\n  if (PUBLIC_API_PATHS.has(path)) return { failure: null, user: null };\n''',
    '''async function authorizeClinicalApi(request: Request, env: Env): Promise<AuthorizationResult> {\n  const path = new URL(request.url).pathname.replace(/\\/+$/, "") || "/";\n  if (PUBLIC_API_PATHS.has(path)) return { failure: null, user: null };\n  if (!env.DB) {\n    return {\n      failure: apiError(\n        "Backend clínico indisponível sem banco persistente.",\n        "DB_REQUIRED",\n        503,\n      ),\n      user: null,\n    };\n  }\n''',
)

regex_once(
    'functions/api/_middleware.ts',
    r'''function getRateLimitKey\(request: Request\): string \{.*?\n\}\n\nfunction checkRateLimit\(key: string\): \{ allowed: boolean; remaining: number; resetAt: number \} \{.*?\n\}\n''',
    '''function getRateLimitKey(request: Request): string {\n  const rawIp = request.headers.get("CF-Connecting-IP")\n    ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()\n    ?? "unknown";\n  const ip = rawIp.slice(0, 128);\n  return `rl:${ip}`;\n}\n\nfunction checkLocalRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {\n  const now = Date.now();\n  let entry = inMemoryRateMap.get(key);\n  if (!entry || now > entry.resetAt) {\n    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };\n    inMemoryRateMap.set(key, entry);\n  }\n  entry.count += 1;\n  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);\n  if (inMemoryRateMap.size > 10_000) {\n    for (const [k, v] of inMemoryRateMap.entries()) if (now > v.resetAt) inMemoryRateMap.delete(k);\n  }\n  return { allowed: entry.count <= RATE_LIMIT_MAX, remaining, resetAt: entry.resetAt };\n}\n\nasync function checkRateLimit(\n  request: Request,\n  env: Env,\n): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {\n  const key = getRateLimitKey(request);\n  const local = checkLocalRateLimit(key);\n  if (!local.allowed || !env.RATE_LIMIT_KV) return local;\n\n  // KV adiciona coordenação entre isolates/PoPs; o Map local continua sendo a\n  // trava dura caso o KV esteja temporariamente indisponível. A combinação evita\n  // que a ausência/latência do backend de rate limit transforme proteção em fail-open.\n  const now = Date.now();\n  const bucket = Math.floor(now / RATE_LIMIT_WINDOW_MS);\n  const sharedKey = `${key}:w${bucket}`;\n  const sharedResetAt = (bucket + 1) * RATE_LIMIT_WINDOW_MS;\n  try {\n    const raw = await env.RATE_LIMIT_KV.get(sharedKey);\n    const parsed = Number.parseInt(raw ?? "0", 10);\n    const count = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed + 1 : 1;\n    await env.RATE_LIMIT_KV.put(sharedKey, String(count), {\n      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 60,\n    });\n    return {\n      allowed: count <= RATE_LIMIT_MAX,\n      remaining: Math.min(local.remaining, Math.max(0, RATE_LIMIT_MAX - count)),\n      resetAt: Math.max(local.resetAt, sharedResetAt),\n    };\n  } catch {\n    return local;\n  }\n}\n''',
    flags=re.S,
)
replace_once(
    'functions/api/_middleware.ts',
    '  const rl = checkRateLimit(getRateLimitKey(request));\n',
    '  const rl = await checkRateLimit(request, env);\n',
)

# 2) Cloudflare login: status/body/timing do not enumerate user state.
replace_once(
    'functions/api/auth/login.ts',
    'const INVALID = { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" };\n',
    '''const INVALID = { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" };\n// Hash válido e não secreto, usado somente para manter custo de verificação\n// semelhante quando o e-mail não existe. Nunca corresponde a uma conta real.\nconst DUMMY_PASSWORD_HASH =\n  "pbkdf2$sha256$100000$bmV1cm9wZWQtYXV0aC1kdW1teQ==$O+SnV7JfIDxMFlQU1aFE6bBIXxdMwA/beS9qUXgBxs8=";\n''',
)
regex_once(
    'functions/api/auth/login.ts',
    r'''  const user = await getUserByEmail\(env\.DB, email\);\n  if \(!user\) return json\(INVALID, 401\);\n\n  if \(!user\.is_active\) \{.*?\n  const ok = await verifyPassword\(password, user\.password_hash\);\n  if \(!ok\) \{\n    await registerFailedAttempt\(env\.DB, user\);\n    return json\(INVALID, 401\);\n  \}\n''',
    '''  const user = await getUserByEmail(env.DB, email);\n  const locked = Boolean(user && isLocked(user));\n  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);\n\n  // Não diferenciar conta inexistente, inativa, bloqueada ou senha incorreta na\n  // resposta pública. O estado real permanece apenas no banco/auditoria.\n  if (!user || !user.is_active || locked || !ok) {\n    if (user && user.is_active && !locked && !ok) {\n      await registerFailedAttempt(env.DB, user);\n    }\n    return json(INVALID, 401);\n  }\n''',
    flags=re.S,
)

# 3) Express login: same anti-enumeration contract and timing parity.
replace_once(
    'server/auth/routes.ts',
    'import { requireAuth, requireAdmin } from "../middleware/auth.js";\n\nexport function registerAuthRoutes(app: Express): void {\n',
    '''import { requireAuth, requireAdmin } from "../middleware/auth.js";\n\n// Calculado uma única vez por processo. Evita resposta significativamente mais\n// rápida para e-mails inexistentes sem introduzir um segredo ou usuário fictício.\nconst DUMMY_PASSWORD_HASH = hashPassword("NeuroPed timing dummy credential 2026");\n\nexport function registerAuthRoutes(app: Express): void {\n''',
)
regex_once(
    'server/auth/routes.ts',
    r'''      const user = db\.select\(\)\.from\(users\)\.where\(eq\(users\.email, parsed\.email\)\)\.get\(\);\n\n      if \(!user \|\| !user\.isActive\) \{.*?\n      \}\n\n      // Sucesso: zera tentativas, atualiza lastLogin, emite tokens\n''',
    '''      const user = db.select().from(users).where(eq(users.email, parsed.email)).get();\n      const locked = Boolean(user && isAccountLocked(user.lockedUntil));\n      const valid = await verifyPassword(\n        parsed.password,\n        user?.passwordHash ?? await DUMMY_PASSWORD_HASH,\n      );\n\n      if (!user || !user.isActive || locked || !valid) {\n        if (user && user.isActive && !locked && !valid) {\n          const newAttempts = user.failedLoginAttempts + 1;\n          const updates: any = { failedLoginAttempts: newAttempts };\n          if (shouldLockoutAccount(newAttempts)) {\n            updates.lockedUntil = calculateLockoutUntil();\n            await logAudit({\n              eventType: "auth.account.locked",\n              context: ctx,\n              targetType: "user",\n              targetId: user.id,\n              metadata: { attempts: newAttempts },\n              success: false,\n            });\n          }\n          db.update(users).set(updates).where(eq(users.id, user.id)).run();\n        }\n\n        const reason = !user\n          ? "user_not_found"\n          : !user.isActive\n            ? "account_inactive"\n            : locked\n              ? "account_locked"\n              : "wrong_password";\n        await logAudit({\n          eventType: "auth.login.failure",\n          context: ctx,\n          ...(user ? { targetType: "user", targetId: user.id } : {}),\n          metadata: { reason },\n          success: false,\n        });\n        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });\n      }\n\n      // Sucesso: zera tentativas, atualiza lastLogin, emite tokens\n''',
    flags=re.S,
)

# 4) Express Clinical Core: a correction must win an atomic compare-and-set.
replace_once(
    'server/routes/clinical-core.ts',
    '''        const previous = sqlite\n          .prepare("SELECT id, patient_id FROM clinical_events WHERE id = ? LIMIT 1")\n          .get(input.supersedesEventId) as { id: string; patient_id: string } | undefined;\n        if (!previous || previous.patient_id !== input.patientId) {\n          return res.status(400).json({\n            error: "Evento supersedido inválido para este paciente",\n            code: "INVALID_SUPERSESSION",\n          });\n        }\n''',
    '''        const previous = sqlite\n          .prepare("SELECT id, patient_id, status FROM clinical_events WHERE id = ? LIMIT 1")\n          .get(input.supersedesEventId) as\n            | { id: string; patient_id: string; status: ClinicalEventStatus }\n            | undefined;\n        if (!previous || previous.patient_id !== input.patientId) {\n          return res.status(400).json({\n            error: "Evento supersedido inválido para este paciente",\n            code: "INVALID_SUPERSESSION",\n          });\n        }\n        if (previous.status !== "active") {\n          return res.status(409).json({\n            error: "O evento já foi corrigido ou invalidado por outra operação.",\n            code: "STALE_SUPERSESSION",\n          });\n        }\n''',
)
regex_once(
    'server/routes/clinical-core.ts',
    r'''      const transaction = sqlite\.transaction\(\(\) => \{\n        sqlite\n          \.prepare\(\n            `INSERT INTO clinical_events.*?\n      \}\);\n      transaction\(\);\n''',
    '''      const transaction = sqlite.transaction(() => {\n        if (input.supersedesEventId) {\n          const correction = sqlite\n            .prepare(\n              "UPDATE clinical_events SET status = 'corrected' WHERE id = ? AND patient_id = ? AND status = 'active'",\n            )\n            .run(input.supersedesEventId, input.patientId);\n          if (correction.changes !== 1) {\n            const stale = new Error("STALE_SUPERSESSION") as Error & { code?: string };\n            stale.code = "STALE_SUPERSESSION";\n            throw stale;\n          }\n        }\n\n        sqlite\n          .prepare(\n            `INSERT INTO clinical_events\n              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,\n               provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,\n               status, created_at)\n             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,\n          )\n          .run(\n            id,\n            input.patientId,\n            req.user!.id,\n            input.eventType,\n            input.occurredAt,\n            input.encounterId ?? null,\n            input.provenance.kind,\n            input.provenance.source,\n            encryptedPayload,\n            input.supersedesEventId ?? null,\n            createdAt,\n          );\n      });\n      try {\n        transaction();\n      } catch (error) {\n        if ((error as { code?: string }).code === "STALE_SUPERSESSION") {\n          return res.status(409).json({\n            error: "O evento já foi corrigido ou invalidado por outra operação.",\n            code: "STALE_SUPERSESSION",\n          });\n        }\n        throw error;\n      }\n''',
    flags=re.S,
)

# 5) D1 Clinical Core: trigger prevents two active corrections of the same source.
trigger = '''    db.prepare(`\n      CREATE TRIGGER IF NOT EXISTS trg_clinical_events_demo_active_supersession\n      BEFORE INSERT ON clinical_events_demo\n      WHEN NEW.supersedes_event_id IS NOT NULL\n      BEGIN\n        SELECT CASE WHEN NOT EXISTS (\n          SELECT 1 FROM clinical_events_demo\n           WHERE id = NEW.supersedes_event_id\n             AND patient_id = NEW.patient_id\n             AND is_demo = 1\n             AND status = 'active'\n        ) THEN RAISE(ABORT, 'STALE_SUPERSESSION') END;\n      END\n    `),\n'''
replace_once(
    'functions/api/clinical-core/_schema.ts',
    '''    db.prepare(`\n      CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_supersedes\n        ON clinical_events_demo(supersedes_event_id)\n    `),\n''',
    '''    db.prepare(`\n      CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_supersedes\n        ON clinical_events_demo(supersedes_event_id)\n    `),\n''' + trigger,
)

replace_once(
    'db/migrations/0006_clinical_core.sql',
    '''CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_supersedes\n  ON clinical_events_demo(supersedes_event_id);\n''',
    '''CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_supersedes\n  ON clinical_events_demo(supersedes_event_id);\n\nCREATE TRIGGER IF NOT EXISTS trg_clinical_events_demo_active_supersession\nBEFORE INSERT ON clinical_events_demo\nWHEN NEW.supersedes_event_id IS NOT NULL\nBEGIN\n  SELECT CASE WHEN NOT EXISTS (\n    SELECT 1 FROM clinical_events_demo\n     WHERE id = NEW.supersedes_event_id\n       AND patient_id = NEW.patient_id\n       AND is_demo = 1\n       AND status = 'active'\n  ) THEN RAISE(ABORT, 'STALE_SUPERSESSION') END;\nEND;\n''',
)

replace_once(
    'functions/api/clinical-core/index.ts',
    '''      const previous = await env.DB\n        .prepare("SELECT id, patient_id FROM clinical_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")\n        .bind(input.supersedesEventId)\n        .first<{ id: string; patient_id: string }>();\n      if (!previous || previous.patient_id !== input.patientId) {\n        return error("Evento supersedido inválido para este paciente.", "INVALID_SUPERSESSION", 400);\n      }\n''',
    '''      const previous = await env.DB\n        .prepare("SELECT id, patient_id, status FROM clinical_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")\n        .bind(input.supersedesEventId)\n        .first<{ id: string; patient_id: string; status: ClinicalEventStatus }>();\n      if (!previous || previous.patient_id !== input.patientId) {\n        return error("Evento supersedido inválido para este paciente.", "INVALID_SUPERSESSION", 400);\n      }\n      if (previous.status !== "active") {\n        return error(\n          "O evento já foi corrigido ou invalidado por outra operação.",\n          "STALE_SUPERSESSION",\n          409,\n        );\n      }\n''',
)
replace_once(
    'functions/api/clinical-core/index.ts',
    '''        env.DB\n          .prepare("UPDATE clinical_events_demo SET status = 'corrected' WHERE id = ? AND patient_id = ? AND is_demo = 1")\n          .bind(input.supersedesEventId, input.patientId),\n''',
    '''        env.DB\n          .prepare("UPDATE clinical_events_demo SET status = 'corrected' WHERE id = ? AND patient_id = ? AND is_demo = 1 AND status = 'active'")\n          .bind(input.supersedesEventId, input.patientId),\n''',
)
replace_once(
    'functions/api/clinical-core/index.ts',
    '''    await env.DB.batch(statements);\n\n    const created: ClinicalEvent = {\n''',
    '''    const batchResults = await env.DB.batch(statements);\n    if (input.supersedesEventId && (batchResults[1]?.meta?.changes ?? 0) !== 1) {\n      return error(\n        "O evento já foi corrigido ou invalidado por outra operação.",\n        "STALE_SUPERSESSION",\n        409,\n      );\n    }\n\n    const created: ClinicalEvent = {\n''',
)
replace_once(
    'functions/api/clinical-core/index.ts',
    '''  } catch (cause) {\n    console.error("[clinical-core.POST]", cause);\n    return error("Não foi possível salvar o evento clínico.", "DB_ERROR", 500);\n  }\n};\n''',
    '''  } catch (cause) {\n    if (String(cause).includes("STALE_SUPERSESSION")) {\n      return error(\n        "O evento já foi corrigido ou invalidado por outra operação.",\n        "STALE_SUPERSESSION",\n        409,\n      );\n    }\n    console.error("[clinical-core.POST]", cause);\n    return error("Não foi possível salvar o evento clínico.", "DB_ERROR", 500);\n  }\n};\n''',
)

# 6) Numeric configuration: never pass NaN/unsafe values to runtime adapters.
env_helper = '''/** Numeric environment parsing with deterministic, bounded fallback. */\nexport function readBoundedIntEnv(\n  name: string,\n  fallback: number,\n  min: number,\n  max: number,\n): number {\n  const raw = process.env[name]?.trim();\n  if (!raw) return fallback;\n  if (!/^\\d+$/.test(raw)) {\n    console.warn(`[config] ${name} inválido; usando fallback ${fallback}.`);\n    return fallback;\n  }\n  const value = Number(raw);\n  if (!Number.isSafeInteger(value) || value < min || value > max) {\n    console.warn(`[config] ${name} fora do intervalo ${min}-${max}; usando fallback ${fallback}.`);\n    return fallback;\n  }\n  return value;\n}\n'''
write('server/lib/env.ts', env_helper)

replace_once(
    'server/index.ts',
    'import { bootstrapAdmin } from "./storage.js";\n',
    'import { bootstrapAdmin } from "./storage.js";\nimport { readBoundedIntEnv } from "./lib/env.js";\n',
)
replace_once(
    'server/index.ts',
    '  const port = parseInt(process.env.PORT || "5000", 10);\n',
    '  const port = readBoundedIntEnv("PORT", 5000, 1, 65_535);\n',
)

replace_once(
    'server/lib/db.ts',
    'import fs from "node:fs";\n',
    'import fs from "node:fs";\nimport { readBoundedIntEnv } from "./env.js";\n',
)
replace_once(
    'server/lib/db.ts',
    '    max: parseInt(process.env.DATABASE_POOL_MAX || "10", 10),\n',
    '    max: readBoundedIntEnv("DATABASE_POOL_MAX", 10, 1, 100),\n',
)

replace_once(
    'server/lib/db-enhanced.ts',
    'import type { IRepositories } from "./repositories";\n',
    'import type { IRepositories } from "./repositories";\nimport { readBoundedIntEnv } from "./env.js";\n',
)
replace_once(
    'server/lib/db-enhanced.ts',
    '    max: parseInt(process.env.DATABASE_POOL_MAX || "20", 10), // Aumentado para 20 (default Postgres)\n',
    '    max: readBoundedIntEnv("DATABASE_POOL_MAX", 20, 1, 100),\n',
)
replace_once(
    'server/lib/db-enhanced.ts',
    '  console.log(`[db] 📊 Pool config: max=${process.env.DATABASE_POOL_MAX || 20}, min=${process.env.DATABASE_POOL_MIN || 2}`);\n',
    '  console.log(`[db] 📊 Pool config: max=${readBoundedIntEnv("DATABASE_POOL_MAX", 20, 1, 100)}`);\n',
)

replace_once(
    'server/routes/files.ts',
    'import { patientReferenceDecision } from "../lib/ownership.js";\n',
    'import { patientReferenceDecision } from "../lib/ownership.js";\nimport { readBoundedIntEnv } from "../lib/env.js";\n',
)
replace_once(
    'server/routes/files.ts',
    'const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10) * 1024 * 1024;\n',
    'const MAX_FILE_SIZE_BYTES = readBoundedIntEnv("MAX_FILE_SIZE_MB", 50, 1, 1024) * 1024 * 1024;\n',
)

# 7) Permanent regression test + update pre-existing middleware expectation.
replace_once(
    'tests/unit/cloudflare-auth-middleware.test.ts',
    'assert.equal((await call("/api/patients", {})).status, 200, "demo sem D1 permanece disponível");\n',
    'assert.equal((await call("/api/patients", {})).status, 503, "rota clínica privada sem D1 falha fechado");\n',
)

regression = r'''import assert from "node:assert/strict";
import fs from "node:fs";
import { readBoundedIntEnv } from "../../server/lib/env";
import { onRequest } from "../../functions/api/_middleware";

const original = { ...process.env };
try {
  process.env.TEST_INT = "17";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 17);
  process.env.TEST_INT = "NaN";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
  process.env.TEST_INT = "999";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
  process.env.TEST_INT = "0";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
} finally {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
}

const privateNoDb = await onRequest({
  request: new Request("https://neuroped.test/api/patients"),
  env: {},
  next: async () => new Response("should-not-run", { status: 200 }),
  data: {},
} as never);
assert.equal(privateNoDb.status, 503);
assert.equal((await privateNoDb.json() as { code?: string }).code, "DB_REQUIRED");

const middleware = fs.readFileSync("functions/api/_middleware.ts", "utf8");
assert.match(middleware, /RATE_LIMIT_KV\.get\(sharedKey\)/);
assert.match(middleware, /RATE_LIMIT_KV\.put\(sharedKey/);
assert.match(middleware, /await checkRateLimit\(request, env\)/);

const cfLogin = fs.readFileSync("functions/api/auth/login.ts", "utf8");
assert.match(cfLogin, /DUMMY_PASSWORD_HASH/);
assert.match(cfLogin, /!user \|\| !user\.is_active \|\| locked \|\| !ok/);
assert.doesNotMatch(cfLogin, /code: "ACCOUNT_LOCKED"/);
assert.doesNotMatch(cfLogin, /code: "ACCOUNT_DISABLED"/);

const expressLogin = fs.readFileSync("server/auth/routes.ts", "utf8");
assert.match(expressLogin, /DUMMY_PASSWORD_HASH/);
assert.match(expressLogin, /!user \|\| !user\.isActive \|\| locked \|\| !valid/);
assert.doesNotMatch(expressLogin, /code: "AUTH_LOCKED"/);

const expressCore = fs.readFileSync("server/routes/clinical-core.ts", "utf8");
assert.match(expressCore, /status = 'active'/);
assert.match(expressCore, /STALE_SUPERSESSION/);
assert.match(expressCore, /correction\.changes !== 1/);

const d1Schema = fs.readFileSync("functions/api/clinical-core/_schema.ts", "utf8");
const d1Core = fs.readFileSync("functions/api/clinical-core/index.ts", "utf8");
const migration = fs.readFileSync("db/migrations/0006_clinical_core.sql", "utf8");
for (const source of [d1Schema, migration]) {
  assert.match(source, /trg_clinical_events_demo_active_supersession/);
  assert.match(source, /RAISE\(ABORT, 'STALE_SUPERSESSION'\)/);
}
assert.match(d1Core, /batchResults\[1\]\?\.meta\?\.changes/);
assert.match(d1Core, /STALE_SUPERSESSION/);

for (const path of ["server/index.ts", "server/lib/db.ts", "server/lib/db-enhanced.ts", "server/routes/files.ts"]) {
  const source = fs.readFileSync(path, "utf8");
  assert.doesNotMatch(source, /parseInt\(process\.env\./);
}

console.log("✓ pontas soltas definitivas: fail-closed, auth anti-enumeração, CAS clínico, KV e env numérico protegidos");
'''
write('tests/unit/definitive-loose-ends.test.ts', regression)

replace_once(
    'package.json',
    '"test:quick-wins": "node --import tsx tests/unit/audit-log-contract.test.ts && node tests/unit/witch-hunt-regressions.test.mjs',
    '"test:quick-wins": "node --import tsx tests/unit/definitive-loose-ends.test.ts && node --import tsx tests/unit/audit-log-contract.test.ts && node tests/unit/witch-hunt-regressions.test.mjs',
)

print('Definitive loose-end fixes applied.')
