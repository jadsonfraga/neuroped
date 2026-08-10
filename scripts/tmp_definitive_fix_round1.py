from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:180]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

# ---------------------------------------------------------------------------
# 1) Cloudflare auth: resposta uniforme + custo criptográfico para email ausente.
# ---------------------------------------------------------------------------
replace_once(
    'functions/api/auth/_crypto.ts',
    '''const PBKDF2_HASH = "SHA-256";\nconst KEY_BITS = 256;''',
    '''const PBKDF2_HASH = "SHA-256";\nconst KEY_BITS = 256;\n\n// Hash sintaticamente válido, mas que não corresponde a nenhuma credencial real.\n// É usado somente para executar o mesmo PBKDF2 quando o e-mail não existe,\n// reduzindo enumeração por diferença grosseira de tempo de resposta.\nexport const DUMMY_PASSWORD_HASH =\n  "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";''',
)

replace_once(
    'functions/api/auth/_shared.ts',
    '''export async function registerFailedAttempt(db: D1Database, u: UserRow): Promise<void> {\n  const attempts = (u.failed_login_attempts ?? 0) + 1;\n  const lockedUntil =\n    attempts >= MAX_FAILED_ATTEMPTS\n      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()\n      : null;\n  await db\n    .prepare(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`)\n    .bind(attempts, lockedUntil, u.id)\n    .run();\n}\n\nexport async function registerSuccessfulLogin(db: D1Database, u: UserRow): Promise<void> {\n  await db\n    .prepare(\n      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL,\n              last_login_at = ? WHERE id = ?`,\n    )\n    .bind(new Date().toISOString(), u.id)\n    .run();\n}''',
    '''export async function registerFailedAttempt(db: D1Database, u: UserRow): Promise<void> {\n  const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();\n  // Incremento atômico: duas tentativas simultâneas não podem ler o mesmo contador\n  // e sobrescrever uma à outra, postergando artificialmente o lockout.\n  await db\n    .prepare(\n      `UPDATE users\n          SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,\n              locked_until = CASE\n                WHEN COALESCE(failed_login_attempts, 0) + 1 >= ? THEN ?\n                ELSE locked_until\n              END\n        WHERE id = ? AND is_active = 1`,\n    )\n    .bind(MAX_FAILED_ATTEMPTS, lockedUntil, u.id)\n    .run();\n}\n\nexport async function registerSuccessfulLogin(db: D1Database, u: UserRow): Promise<boolean> {\n  const now = new Date().toISOString();\n  const result = await db\n    .prepare(\n      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL,\n              last_login_at = ?\n        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR locked_until <= ?)`,\n    )\n    .bind(now, u.id, now)\n    .run();\n  return (result.meta?.changes ?? 0) === 1;\n}''',
)

replace_once(
    'functions/api/auth/login.ts',
    '''import { verifyPassword } from "./_crypto";''',
    '''import { DUMMY_PASSWORD_HASH, verifyPassword } from "./_crypto";''',
)
replace_once(
    'functions/api/auth/login.ts',
    '''  const user = await getUserByEmail(env.DB, email);\n  if (!user) return json(INVALID, 401);\n\n  if (!user.is_active) {\n    return json({ error: "Conta desativada.", code: "ACCOUNT_DISABLED" }, 403);\n  }\n  if (isLocked(user)) {\n    return json(\n      { error: "Conta temporariamente bloqueada por tentativas. Aguarde alguns minutos.", code: "ACCOUNT_LOCKED" },\n      423,\n    );\n  }\n\n  const ok = await verifyPassword(password, user.password_hash);\n  if (!ok) {\n    await registerFailedAttempt(env.DB, user);\n    return json(INVALID, 401);\n  }\n\n  await registerSuccessfulLogin(env.DB, user);''',
    '''  const user = await getUserByEmail(env.DB, email);\n  const locked = user ? isLocked(user) : false;\n  // Mesmo quando o e-mail não existe, executa PBKDF2 sobre um hash sentinela.\n  // Estado inexistente/inativo/bloqueado e senha incorreta compartilham a mesma\n  // resposta externa para não funcionar como oráculo de cadastro.\n  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);\n  if (!user || !user.is_active || locked || !ok) {\n    if (user && user.is_active && !locked && !ok) {\n      await registerFailedAttempt(env.DB, user);\n    }\n    return json(INVALID, 401);\n  }\n\n  if (!(await registerSuccessfulLogin(env.DB, user))) {\n    return json(INVALID, 401);\n  }''',
)

# Não criar refresh para conta que tenha sido desativada/bloqueada depois do SELECT.
replace_once(
    'functions/api/auth/_sessions.ts',
    '''  await db\n    .prepare(\n      `INSERT INTO auth_refresh_sessions\n         (id, user_id, family_id, token_hash, parent_session_id,\n          replaced_by_session_id, expires_at, revoked_at, revoke_reason,\n          created_at, last_used_at)\n       VALUES (?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?, NULL)`,\n    )\n    .bind(\n      refreshId,\n      user.id,\n      familyId,\n      tokens.refreshHash,\n      expiresAt,\n      now.toISOString(),\n    )\n    .run();''',
    '''  const inserted = await db\n    .prepare(\n      `INSERT INTO auth_refresh_sessions\n         (id, user_id, family_id, token_hash, parent_session_id,\n          replaced_by_session_id, expires_at, revoked_at, revoke_reason,\n          created_at, last_used_at)\n       SELECT ?, id, ?, ?, NULL, NULL, ?, NULL, NULL, ?, NULL\n         FROM users\n        WHERE id = ? AND is_active = 1\n          AND (locked_until IS NULL OR locked_until <= ?)`,\n    )\n    .bind(\n      refreshId,\n      familyId,\n      tokens.refreshHash,\n      expiresAt,\n      now.toISOString(),\n      user.id,\n      now.toISOString(),\n    )\n    .run();\n  if ((inserted.meta?.changes ?? 0) !== 1) {\n    throw new Error("AUTH_USER_STATE_CHANGED");\n  }''',
)

# ---------------------------------------------------------------------------
# 2) Express auth: mesma resposta pública e dummy bcrypt para reduzir timing.
# ---------------------------------------------------------------------------
replace_once(
    'server/lib/password.ts',
    '''const LOCKOUT_MINUTES = 15;''',
    '''const LOCKOUT_MINUTES = 15;\n\n// Hash bcrypt válido de custo 12 que não corresponde a credencial do sistema.\n// Evita que e-mail inexistente pule completamente o trabalho criptográfico.\nexport const DUMMY_BCRYPT_HASH =\n  "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";''',
)
replace_once(
    'server/auth/routes.ts',
    '''import { hashPassword, verifyPassword, shouldLockoutAccount, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";''',
    '''import { DUMMY_BCRYPT_HASH, hashPassword, verifyPassword, shouldLockoutAccount, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";''',
)

old_login = '''      const user = db.select().from(users).where(eq(users.email, parsed.email)).get();\n\n      if (!user || !user.isActive) {\n        await logAudit({\n          eventType: "auth.login.failure",\n          context: ctx,\n          metadata: { email: parsed.email, reason: "user_not_found_or_inactive" },\n          success: false,\n        });\n        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });\n      }\n\n      if (isAccountLocked(user.lockedUntil)) {\n        await logAudit({\n          eventType: "auth.login.failure",\n          context: ctx,\n          targetType: "user",\n          targetId: user.id,\n          metadata: { reason: "account_locked", lockedUntil: user.lockedUntil },\n          success: false,\n        });\n        return res.status(423).json({\n          error: "Conta temporariamente bloqueada por excesso de tentativas",\n          code: "AUTH_LOCKED",\n        });\n      }\n\n      const valid = await verifyPassword(parsed.password, user.passwordHash);\n      if (!valid) {\n        const newAttempts = user.failedLoginAttempts + 1;\n        const updates: any = { failedLoginAttempts: newAttempts };\n        if (shouldLockoutAccount(newAttempts)) {\n          updates.lockedUntil = calculateLockoutUntil();\n          await logAudit({\n            eventType: "auth.account.locked",\n            context: ctx,\n            targetType: "user",\n            targetId: user.id,\n            metadata: { attempts: newAttempts },\n            success: false,\n          });\n        }\n        db.update(users).set(updates).where(eq(users.id, user.id)).run();\n\n        await logAudit({\n          eventType: "auth.login.failure",\n          context: ctx,\n          targetType: "user",\n          targetId: user.id,\n          metadata: { reason: "wrong_password", attempts: newAttempts },\n          success: false,\n        });\n        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });\n      }'''
new_login = '''      const user = db.select().from(users).where(eq(users.email, parsed.email)).get();\n      const locked = Boolean(user && isAccountLocked(user.lockedUntil));\n      const valid = await verifyPassword(parsed.password, user?.passwordHash ?? DUMMY_BCRYPT_HASH);\n\n      if (!user || !user.isActive || locked || !valid) {\n        if (user && user.isActive && !locked && !valid) {\n          const newAttempts = user.failedLoginAttempts + 1;\n          const updates: any = { failedLoginAttempts: newAttempts };\n          if (shouldLockoutAccount(newAttempts)) {\n            updates.lockedUntil = calculateLockoutUntil();\n            await logAudit({\n              eventType: "auth.account.locked",\n              context: ctx,\n              targetType: "user",\n              targetId: user.id,\n              metadata: { attempts: newAttempts },\n              success: false,\n            });\n          }\n          db.update(users).set(updates).where(eq(users.id, user.id)).run();\n        }\n\n        await logAudit({\n          eventType: "auth.login.failure",\n          context: ctx,\n          ...(user ? { targetType: "user", targetId: user.id } : {}),\n          metadata: {\n            email: parsed.email,\n            reason: !user\n              ? "user_not_found"\n              : !user.isActive\n                ? "account_inactive"\n                : locked\n                  ? "account_locked"\n                  : "wrong_password",\n          },\n          success: false,\n        });\n        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });\n      }'''
replace_once('server/auth/routes.ts', old_login, new_login)

# ---------------------------------------------------------------------------
# 3) Cloudflare middleware: produção sem D1 falha fechada também em leituras.
#    KV passa a propagar bloqueio entre isolates quando algum isolate atinge teto.
# ---------------------------------------------------------------------------
replace_once(
    'functions/api/_middleware.ts',
    '''function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {\n  const now = Date.now();\n  let entry = inMemoryRateMap.get(key);\n  if (!entry || now > entry.resetAt) {\n    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };\n    inMemoryRateMap.set(key, entry);\n  }\n  entry.count += 1;\n  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);\n  if (inMemoryRateMap.size > 10_000) {\n    for (const [k, v] of inMemoryRateMap.entries()) if (now > v.resetAt) inMemoryRateMap.delete(k);\n  }\n  return { allowed: entry.count <= RATE_LIMIT_MAX, remaining, resetAt: entry.resetAt };\n}''',
    '''async function checkRateLimit(\n  key: string,\n  kv?: KVNamespace,\n): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {\n  const now = Date.now();\n  const blockKey = `rate-limit:block:${key}`;\n  if (kv) {\n    try {\n      const distributedReset = Number(await kv.get(blockKey));\n      if (Number.isFinite(distributedReset) && distributedReset > now) {\n        return { allowed: false, remaining: 0, resetAt: distributedReset };\n      }\n    } catch {\n      // KV é reforço distribuído; falha dele não derruba a API nem elimina o teto local.\n    }\n  }\n\n  let entry = inMemoryRateMap.get(key);\n  if (!entry || now > entry.resetAt) {\n    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };\n    inMemoryRateMap.set(key, entry);\n  }\n  entry.count += 1;\n  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);\n  const allowed = entry.count <= RATE_LIMIT_MAX;\n  if (!allowed && kv) {\n    try {\n      await kv.put(blockKey, String(entry.resetAt), { expirationTtl: 60 });\n    } catch {\n      // Mantém o bloqueio local mesmo se a propagação distribuída falhar.\n    }\n  }\n  if (inMemoryRateMap.size > 10_000) {\n    for (const [k, v] of inMemoryRateMap.entries()) if (now > v.resetAt) inMemoryRateMap.delete(k);\n  }\n  return { allowed, remaining, resetAt: entry.resetAt };\n}''',
)
replace_once(
    'functions/api/_middleware.ts',
    '''  const rl = checkRateLimit(getRateLimitKey(request));\n  if (!rl.allowed) {''',
    '''  const rl = await checkRateLimit(getRateLimitKey(request), env.RATE_LIMIT_KV);\n  if (!rl.allowed) {''',
)
replace_once(
    'functions/api/_middleware.ts',
    '''  const authorization = await authorizeClinicalApi(request, env);''',
    '''  const requestPathBeforeAuth = new URL(request.url).pathname.replace(/\\/+$/, "") || "/";\n  const isProductionBeforeAuth = (env.ENVIRONMENT ?? "").toLowerCase() === "production";\n  const demoWritesEnabledBeforeAuth = env.DEMO_API_WRITES_ENABLED === "true";\n  if (\n    isProductionBeforeAuth &&\n    !env.DB &&\n    !demoWritesEnabledBeforeAuth &&\n    !PUBLIC_API_PATHS.has(requestPathBeforeAuth)\n  ) {\n    return new Response(JSON.stringify({\n      error: "Backend persistente indisponível. A rota protegida falhou fechada.",\n      code: "DB_REQUIRED",\n    }), {\n      status: 503,\n      headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },\n    });\n  }\n\n  const authorization = await authorizeClinicalApi(request, env);''',
)

# ---------------------------------------------------------------------------
# 4) Clinical Core: uma correção só pode superseder evento ainda ativo.
# ---------------------------------------------------------------------------
replace_once(
    'functions/api/clinical-core/index.ts',
    '''      const previous = await env.DB\n        .prepare("SELECT id, patient_id FROM clinical_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")\n        .bind(input.supersedesEventId)\n        .first<{ id: string; patient_id: string }>();\n      if (!previous || previous.patient_id !== input.patientId) {\n        return error("Evento supersedido inválido para este paciente.", "INVALID_SUPERSESSION", 400);\n      }''',
    '''      const previous = await env.DB\n        .prepare("SELECT id, patient_id, status FROM clinical_events_demo WHERE id = ? AND is_demo = 1 LIMIT 1")\n        .bind(input.supersedesEventId)\n        .first<{ id: string; patient_id: string; status: ClinicalEventStatus }>();\n      if (!previous || previous.patient_id !== input.patientId) {\n        return error("Evento supersedido inválido para este paciente.", "INVALID_SUPERSESSION", 400);\n      }\n      if (previous.status !== "active") {\n        return error("O evento já foi supersedido. Recarregue a linha clínica.", "STALE_SUPERSESSION", 409);\n      }''',
)

# Reescreve o bloco de insert/update D1 para update otimista primeiro e insert condicional.
p = ROOT / 'functions/api/clinical-core/index.ts'
s = p.read_text('utf-8')
start = s.index('    const statements = [')
end = s.index('\n\n    const created: ClinicalEvent = {', start)
new_block = '''    const insertSql = `INSERT INTO clinical_events_demo\n            (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,\n             provenance_kind, provenance_source, payload_json, supersedes_event_id,\n             status, is_demo, created_at)\n           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)`;\n    const insertBindings = [\n      id,\n      input.patientId,\n      user.id,\n      input.eventType,\n      input.occurredAt,\n      input.encounterId ?? null,\n      input.provenance.kind,\n      input.provenance.source,\n      JSON.stringify(payload),\n      input.supersedesEventId ?? null,\n      createdAt,\n    ];\n\n    if (input.supersedesEventId) {\n      const correctionResults = await env.DB.batch([\n        env.DB\n          .prepare(\n            "UPDATE clinical_events_demo SET status = 'corrected' WHERE id = ? AND patient_id = ? AND is_demo = 1 AND status = 'active'",\n          )\n          .bind(input.supersedesEventId, input.patientId),\n        env.DB\n          .prepare(\n            `INSERT INTO clinical_events_demo\n              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,\n               provenance_kind, provenance_source, payload_json, supersedes_event_id,\n               status, is_demo, created_at)\n             SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?\n              WHERE changes() = 1`,\n          )\n          .bind(...insertBindings),\n      ]);\n      if (\n        (correctionResults[0]?.meta?.changes ?? 0) !== 1 ||\n        (correctionResults[1]?.meta?.changes ?? 0) !== 1\n      ) {\n        return error("O evento mudou durante a correção. Recarregue a linha clínica.", "STALE_SUPERSESSION", 409);\n      }\n    } else {\n      const inserted = await env.DB.prepare(insertSql).bind(...insertBindings).run();\n      if ((inserted.meta?.changes ?? 0) !== 1) {\n        return error("Não foi possível persistir o evento clínico.", "DB_ERROR", 500);\n      }\n    }'''
p.write_text(s[:start] + new_block + s[end:], 'utf-8')

replace_once(
    'server/routes/clinical-core.ts',
    '''        const previous = sqlite\n          .prepare("SELECT id, patient_id FROM clinical_events WHERE id = ? LIMIT 1")\n          .get(input.supersedesEventId) as { id: string; patient_id: string } | undefined;\n        if (!previous || previous.patient_id !== input.patientId) {\n          return res.status(400).json({\n            error: "Evento supersedido inválido para este paciente",\n            code: "INVALID_SUPERSESSION",\n          });\n        }''',
    '''        const previous = sqlite\n          .prepare("SELECT id, patient_id, status FROM clinical_events WHERE id = ? LIMIT 1")\n          .get(input.supersedesEventId) as { id: string; patient_id: string; status: ClinicalEventStatus } | undefined;\n        if (!previous || previous.patient_id !== input.patientId) {\n          return res.status(400).json({\n            error: "Evento supersedido inválido para este paciente",\n            code: "INVALID_SUPERSESSION",\n          });\n        }\n        if (previous.status !== "active") {\n          return res.status(409).json({\n            error: "O evento já foi supersedido. Recarregue a linha clínica.",\n            code: "STALE_SUPERSESSION",\n          });\n        }''',
)

old_tx = '''      const transaction = sqlite.transaction(() => {\n        sqlite\n          .prepare(\n            `INSERT INTO clinical_events\n              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,\n               provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,\n               status, created_at)\n             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,\n          )\n          .run(\n            id,\n            input.patientId,\n            req.user!.id,\n            input.eventType,\n            input.occurredAt,\n            input.encounterId ?? null,\n            input.provenance.kind,\n            input.provenance.source,\n            encryptedPayload,\n            input.supersedesEventId ?? null,\n            createdAt,\n          );\n        if (input.supersedesEventId) {\n          sqlite\n            .prepare("UPDATE clinical_events SET status = 'corrected' WHERE id = ?")\n            .run(input.supersedesEventId);\n        }\n      });\n      transaction();'''
new_tx = '''      const transaction = sqlite.transaction(() => {\n        if (input.supersedesEventId) {\n          const corrected = sqlite\n            .prepare(\n              "UPDATE clinical_events SET status = 'corrected' WHERE id = ? AND patient_id = ? AND status = 'active'",\n            )\n            .run(input.supersedesEventId, input.patientId);\n          if (corrected.changes !== 1) return false;\n        }\n\n        const inserted = sqlite\n          .prepare(\n            `INSERT INTO clinical_events\n              (id, patient_id, author_user_id, event_type, occurred_at, encounter_id,\n               provenance_kind, provenance_source, payload_encrypted, supersedes_event_id,\n               status, created_at)\n             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,\n          )\n          .run(\n            id,\n            input.patientId,\n            req.user!.id,\n            input.eventType,\n            input.occurredAt,\n            input.encounterId ?? null,\n            input.provenance.kind,\n            input.provenance.source,\n            encryptedPayload,\n            input.supersedesEventId ?? null,\n            createdAt,\n          );\n        return inserted.changes === 1;\n      });\n      if (!transaction()) {\n        return res.status(409).json({\n          error: "O evento mudou durante a correção. Recarregue a linha clínica.",\n          code: "STALE_SUPERSESSION",\n        });\n      }'''
replace_once('server/routes/clinical-core.ts', old_tx, new_tx)

# ---------------------------------------------------------------------------
# 5) Travas permanentes.
# ---------------------------------------------------------------------------
(ROOT / 'tests/unit/auth-hardening-regressions.test.ts').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport { DUMMY_PASSWORD_HASH, verifyPassword as verifyWorkerPassword } from "../../functions/api/auth/_crypto";\nimport { DUMMY_BCRYPT_HASH, verifyPassword as verifyServerPassword } from "../../server/lib/password";\n\nassert.equal(await verifyWorkerPassword("senha-que-nao-existe", DUMMY_PASSWORD_HASH), false);\nassert.equal(await verifyServerPassword("senha-que-nao-existe", DUMMY_BCRYPT_HASH), false);\n\nconst cfLogin = fs.readFileSync("functions/api/auth/login.ts", "utf8");\nconst exLogin = fs.readFileSync("server/auth/routes.ts", "utf8");\nconst shared = fs.readFileSync("functions/api/auth/_shared.ts", "utf8");\nconst sessions = fs.readFileSync("functions/api/auth/_sessions.ts", "utf8");\n\nassert.doesNotMatch(cfLogin, /ACCOUNT_DISABLED|ACCOUNT_LOCKED|status[^\\n]*423/);\nassert.match(cfLogin, /DUMMY_PASSWORD_HASH/);\nassert.match(cfLogin, /!user \\|\\| !user\\.is_active \\|\\| locked \\|\\| !ok/);\nassert.doesNotMatch(exLogin, /AUTH_LOCKED|status\\(423\\)/);\nassert.match(exLogin, /DUMMY_BCRYPT_HASH/);\nassert.match(shared, /failed_login_attempts = COALESCE\\(failed_login_attempts, 0\\) \\+ 1/);\nassert.match(shared, /registerSuccessfulLogin[\\s\\S]*meta\\?\\.changes/);\nassert.match(sessions, /FROM users[\\s\\S]{0,300}is_active = 1[\\s\\S]{0,300}inserted\\.meta\\?\\.changes/);\n\nconsole.log("✓ auth: resposta não enumerável, dummy hash e contadores concorrentes protegidos");\n''', 'utf-8')

(ROOT / 'tests/unit/clinical-core-supersession-regression.test.mjs').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\n\nconst cf = fs.readFileSync("functions/api/clinical-core/index.ts", "utf8");\nconst ex = fs.readFileSync("server/routes/clinical-core.ts", "utf8");\n\nfor (const source of [cf, ex]) {\n  assert.match(source, /STALE_SUPERSESSION/);\n  assert.match(source, /status = 'active'/);\n}\nassert.match(cf, /WHERE changes\\(\\) = 1/);\nassert.match(cf, /correctionResults\\[0\\]\\?\\.meta\\?\\.changes/);\nassert.match(cf, /correctionResults\\[1\\]\\?\\.meta\\?\\.changes/);\nassert.match(ex, /corrected\\.changes !== 1/);\nassert.match(ex, /inserted\\.changes === 1/);\n\nconsole.log("✓ Clinical Core: correção append-only rejeita supersessão obsoleta sem criar órfão");\n''', 'utf-8')

# Middleware: produção sem D1 deve falhar fechado e KV distribuído precisa ser observado.
p = ROOT / 'tests/unit/cloudflare-auth-middleware.test.ts'
s = p.read_text('utf-8')
anchor = 'assert.equal((await call("/api/patients", {})).status, 200, "demo sem D1 permanece disponível");\n'
addition = anchor + '''assert.equal(\n  (await call("/api/patients", { ENVIRONMENT: "production" })).status,\n  503,\n  "produção sem D1 falha fechada também em leitura protegida",\n);\n'''
if anchor not in s:
    raise SystemExit('cloudflare middleware test anchor missing')
s = s.replace(anchor, addition, 1)
anchor2 = 'assert.equal((await call("/api/health", { DB: {} })).status, 200, "health é público");\n'
addition2 = anchor2 + '''\nconst distributedBlockUntil = Date.now() + 45_000;\nconst blockedByKv = await onRequest({\n  request: new Request("https://neuroped.test/api/health", {\n    headers: { "CF-Connecting-IP": "203.0.113.55" },\n  }),\n  env: {\n    RATE_LIMIT_KV: {\n      get: async () => String(distributedBlockUntil),\n      put: async () => undefined,\n    },\n  },\n  next,\n  data: {},\n} as never);\nassert.equal(blockedByKv.status, 429, "bloqueio distribuído em KV deve ser respeitado entre isolates");\n'''
if anchor2 not in s:
    raise SystemExit('cloudflare middleware KV anchor missing')
p.write_text(s.replace(anchor2, addition2, 1), 'utf-8')

# Conecta novos testes ao gate rápido permanente.
p = ROOT / 'package.json'
s = p.read_text('utf-8')
old = '"test:quick-wins": "node --import tsx tests/unit/audit-log-contract.test.ts && node tests/unit/witch-hunt-regressions.test.mjs &&'
new = '"test:quick-wins": "node --import tsx tests/unit/auth-hardening-regressions.test.ts && node tests/unit/clinical-core-supersession-regression.test.mjs && node --import tsx tests/unit/audit-log-contract.test.ts && node tests/unit/witch-hunt-regressions.test.mjs &&'
if old not in s:
    raise SystemExit('package test:quick-wins anchor missing')
p.write_text(s.replace(old, new, 1), 'utf-8')

print('Round 1 definitive fixes applied')
