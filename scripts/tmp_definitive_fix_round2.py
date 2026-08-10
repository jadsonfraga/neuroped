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

# ---------------------------------------------------------------------------
# 1) Parsing numérico de configuração: nunca permitir NaN/porta/faixa inválida.
# ---------------------------------------------------------------------------
(ROOT / 'server/lib/runtimeConfig.ts').write_text('''export class RuntimeConfigurationError extends Error {\n  constructor(message: string) {\n    super(message);\n    this.name = "RuntimeConfigurationError";\n  }\n}\n\nfunction parseBoundedInteger(\n  raw: string,\n  name: string,\n  min: number,\n  max: number,\n): number {\n  const normalized = raw.trim();\n  if (!/^\\d+$/.test(normalized)) {\n    throw new RuntimeConfigurationError(`${name} deve ser um inteiro entre ${min} e ${max}.`);\n  }\n  const value = Number(normalized);\n  if (!Number.isSafeInteger(value) || value < min || value > max) {\n    throw new RuntimeConfigurationError(`${name} deve estar entre ${min} e ${max}.`);\n  }\n  return value;\n}\n\nexport function boundedIntegerEnv(\n  name: string,\n  fallback: number,\n  min: number,\n  max: number,\n): number {\n  const raw = process.env[name];\n  if (raw === undefined || raw.trim() === "") return fallback;\n  return parseBoundedInteger(raw, name, min, max);\n}\n\nexport function requiredBoundedIntegerEnv(\n  name: string,\n  min: number,\n  max: number,\n): number {\n  const raw = process.env[name];\n  if (raw === undefined || raw.trim() === "") {\n    throw new RuntimeConfigurationError(`${name} é obrigatório.`);\n  }\n  return parseBoundedInteger(raw, name, min, max);\n}\n''', 'utf-8')

replace_once(
    'server/index.ts',
    'import { bootstrapAdmin } from "./storage.js";\n',
    'import { bootstrapAdmin } from "./storage.js";\nimport { boundedIntegerEnv } from "./lib/runtimeConfig.js";\n',
)
replace_once(
    'server/index.ts',
    '  const port = parseInt(process.env.PORT || "5000", 10);',
    '  const port = boundedIntegerEnv("PORT", 5000, 1, 65535);',
)

replace_once(
    'server/routes/files.ts',
    '''  CloudStorageConfigError,\n} from "../lib/cloudStorage.js";''',
    '''  CloudStorageConfigError,\n  CloudStorageError,\n} from "../lib/cloudStorage.js";''',
)
replace_once(
    'server/routes/files.ts',
    'import { patientReferenceDecision } from "../lib/ownership.js";\n',
    'import { patientReferenceDecision } from "../lib/ownership.js";\nimport { boundedIntegerEnv } from "../lib/runtimeConfig.js";\n',
)
replace_once(
    'server/routes/files.ts',
    'const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10) * 1024 * 1024;',
    'const MAX_FILE_SIZE_BYTES = boundedIntegerEnv("MAX_FILE_SIZE_MB", 50, 1, 2048) * 1024 * 1024;',
)

replace_once(
    'server/lib/email.ts',
    'import type { Transporter } from "nodemailer";\n',
    'import type { Transporter } from "nodemailer";\nimport { requiredBoundedIntegerEnv } from "./runtimeConfig.js";\n',
)
replace_once(
    'server/lib/email.ts',
    '''  const port = process.env.SMTP_PORT;\n  const user = process.env.SMTP_USER;''',
    '''  const portRaw = process.env.SMTP_PORT;\n  const user = process.env.SMTP_USER;''',
)
replace_once(
    'server/lib/email.ts',
    '''  if (!host || !port || !user || !password) {''',
    '''  if (!host || !portRaw || !user || !password) {''',
)
replace_once(
    'server/lib/email.ts',
    '''  transporter = nodemailer.createTransport({\n    host,\n    port: parseInt(port, 10),\n    secure: parseInt(port, 10) === 465,''',
    '''  const port = requiredBoundedIntegerEnv("SMTP_PORT", 1, 65535);\n  transporter = nodemailer.createTransport({\n    host,\n    port,\n    secure: port === 465,''',
)

for path, fallback in [('server/lib/db.ts', 10), ('server/lib/db-enhanced.ts', 20)]:
    import_anchor = 'import fs from "node:fs";\n'
    replace_once(path, import_anchor, import_anchor + 'import { boundedIntegerEnv } from "./runtimeConfig.js";\n')
    replace_once(
        path,
        f'max: parseInt(process.env.DATABASE_POOL_MAX || "{fallback}", 10)',
        f'max: boundedIntegerEnv("DATABASE_POOL_MAX", {fallback}, 1, 100)',
    )

# ---------------------------------------------------------------------------
# 2) Object storage: 404 real ≠ indisponibilidade/erro de credencial.
# ---------------------------------------------------------------------------
replace_once(
    'server/lib/cloudStorage.ts',
    '''export class CloudStorageError extends Error {}\nexport class CloudStorageConfigError extends CloudStorageError {}''',
    '''export class CloudStorageError extends Error {}\nexport class CloudStorageConfigError extends CloudStorageError {}\n\nfunction isStorageNotFoundError(error: unknown): boolean {\n  if (!error || typeof error !== "object") return false;\n  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };\n  return (\n    candidate.$metadata?.httpStatusCode === 404 ||\n    candidate.name === "NotFound" ||\n    candidate.name === "NoSuchKey" ||\n    candidate.name === "NoSuchObject"\n  );\n}''',
)
replace_once(
    'server/lib/cloudStorage.ts',
    '''  } catch {\n    return null;\n  }\n}\n\n/**\n * Gera chave segura''',
    '''  } catch (error) {\n    if (isStorageNotFoundError(error)) return null;\n    throw new CloudStorageError("Falha ao consultar o objeto no storage.");\n  }\n}\n\n/**\n * Gera chave segura''',
)

# ---------------------------------------------------------------------------
# 3) Rotas de arquivos: revalidar estado após I/O assíncrono e soft-delete antes
#    de apagar o bucket, impedindo URL/confirm/delete baseado em leitura obsoleta.
# ---------------------------------------------------------------------------
# Upload: paciente pode desaparecer/trocar ownership enquanto URL é assinada.
anchor = '''      const signed = await getUploadSignedUrl({\n        key,\n        contentType: parsed.mimeType,\n        contentLength: parsed.size,\n        metadata: {\n          uploaded_by: req.user!.id,\n          patient_id: parsed.patientId || "",\n          category: parsed.category,\n        },\n      });\n\n      // Cria registro em files (status pendente — sha256 sera setado em /confirm)'''
replacement = '''      const signed = await getUploadSignedUrl({\n        key,\n        contentType: parsed.mimeType,\n        contentLength: parsed.size,\n        metadata: {\n          uploaded_by: req.user!.id,\n          patient_id: parsed.patientId || "",\n          category: parsed.category,\n        },\n      });\n\n      if (parsed.patientId) {\n        const freshPatient = db\n          .select()\n          .from(patients)\n          .where(eq(patients.id, parsed.patientId))\n          .get();\n        const freshDecision = patientReferenceDecision(req.user!, freshPatient);\n        if (freshDecision === "not_found") {\n          return res.status(404).json({ error: "Paciente nao encontrado", code: "NOT_FOUND" });\n        }\n        if (freshDecision === "forbidden") {\n          return res.status(403).json({ error: "Sem permissao", code: "FORBIDDEN" });\n        }\n      }\n\n      // Cria registro em files (status pendente — sha256 sera setado em /confirm)'''
replace_once('server/routes/files.ts', anchor, replacement)

# Sign-upload: storage indisponível é 503, não 500 genérico.
replace_once(
    'server/routes/files.ts',
    '''      if (e instanceof CloudStorageConfigError) {\n        return res.status(503).json({ error: "Storage nao configurado", code: "STORAGE_NOT_CONFIGURED" });\n      }\n      console.error("[files.sign-upload]", e);''',
    '''      if (e instanceof CloudStorageConfigError) {\n        return res.status(503).json({ error: "Storage nao configurado", code: "STORAGE_NOT_CONFIGURED" });\n      }\n      if (e instanceof CloudStorageError) {\n        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });\n      }\n      console.error("[files.sign-upload]", e);''',
)

# Confirm: só confirma se arquivo continua não deletado depois do HEAD remoto.
replace_once(
    'server/routes/files.ts',
    '''      const updated = db.update(filesTable)\n        .set({ sha256: sha })\n        .where(eq(filesTable.id, file.id))\n        .returning()\n        .get();\n\n      return res.json({''',
    '''      const updated = db.update(filesTable)\n        .set({ sha256: sha })\n        .where(and(eq(filesTable.id, file.id), eq(filesTable.isDeleted, false)))\n        .returning()\n        .get();\n      if (!updated) {\n        return res.status(409).json({ error: "Arquivo mudou durante a confirmacao", code: "FILE_STATE_CHANGED" });\n      }\n\n      return res.json({''',
)
replace_once(
    'server/routes/files.ts',
    '''    } catch (e: any) {\n      console.error("[files.confirm]", e);\n      return res.status(500).json({ error: "Erro interno" });\n    }\n  });\n\n  /**\n   * GET /api/files/:id''',
    '''    } catch (e: any) {\n      if (e instanceof CloudStorageError) {\n        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });\n      }\n      console.error("[files.confirm]", e);\n      return res.status(500).json({ error: "Erro interno" });\n    }\n  });\n\n  /**\n   * GET /api/files/:id''',
)

# Download: reconsulta depois de gerar URL; não entrega URL baseada em linha apagada no intervalo.
replace_once(
    'server/routes/files.ts',
    '''      const signed = await getDownloadSignedUrl(file.storageKey);\n\n      await logAudit({\n        eventType: "file.download",\n        context: ctx,\n        targetType: "file",\n        targetId: file.id,\n        metadata: { filename: file.filename, patientId: file.patientId },\n      });\n\n      return res.json({\n        id: file.id,\n        filename: file.filename,\n        mimeType: file.mimeType,\n        sizeBytes: file.sizeBytes,\n        sha256: file.sha256,\n        category: file.category,\n        patientId: file.patientId,\n        createdAt: file.createdAt,''',
    '''      const signed = await getDownloadSignedUrl(file.storageKey);\n      const freshFile = db.select().from(filesTable).where(eq(filesTable.id, file.id)).get();\n      if (!freshFile || freshFile.isDeleted) {\n        return res.status(404).json({ error: "Arquivo nao encontrado" });\n      }\n      if (freshFile.ownerUserId !== req.user!.id && req.user!.role !== "admin") {\n        return res.status(403).json({ error: "Sem permissao" });\n      }\n\n      await logAudit({\n        eventType: "file.download",\n        context: ctx,\n        targetType: "file",\n        targetId: freshFile.id,\n        metadata: { filename: freshFile.filename, patientId: freshFile.patientId },\n      });\n\n      return res.json({\n        id: freshFile.id,\n        filename: freshFile.filename,\n        mimeType: freshFile.mimeType,\n        sizeBytes: freshFile.sizeBytes,\n        sha256: freshFile.sha256,\n        category: freshFile.category,\n        patientId: freshFile.patientId,\n        createdAt: freshFile.createdAt,''',
)
replace_once(
    'server/routes/files.ts',
    '''    } catch (e: any) {\n      console.error("[files.get]", e);\n      return res.status(500).json({ error: "Erro interno" });\n    }\n  });\n\n  /**\n   * GET /api/files?patientId''',
    '''    } catch (e: any) {\n      if (e instanceof CloudStorageError) {\n        return res.status(503).json({ error: "Storage indisponivel", code: "STORAGE_UNAVAILABLE" });\n      }\n      console.error("[files.get]", e);\n      return res.status(500).json({ error: "Erro interno" });\n    }\n  });\n\n  /**\n   * GET /api/files?patientId''',
)

# Delete: marca DB primeiro e confirma affected row; remoção do bucket fica best-effort depois.
old_delete = '''      // Tenta apagar do bucket; mesmo que falhe, marca soft-delete em DB\n      try {\n        await deleteObject(file.storageKey);\n      } catch (e) {\n        console.error("[files.delete] bucket delete failed:", e);\n      }\n\n      db.update(filesTable)\n        .set({ isDeleted: true, deletedAt: new Date().toISOString() })\n        .where(eq(filesTable.id, file.id))\n        .run();\n\n      await logAudit({\n        eventType: "file.delete",\n        context: ctx,\n        targetType: "file",\n        targetId: file.id,\n        metadata: { filename: file.filename },\n      });'''
new_delete = '''      const deleted = db.update(filesTable)\n        .set({ isDeleted: true, deletedAt: new Date().toISOString() })\n        .where(and(eq(filesTable.id, file.id), eq(filesTable.isDeleted, false)))\n        .returning()\n        .get();\n      if (!deleted) return res.status(404).json({ error: "Arquivo nao encontrado" });\n\n      // Estado local é revogado antes da I/O remota. Assim outro request não recebe\n      // uma nova URL assinada enquanto o bucket ainda está sendo apagado.\n      try {\n        await deleteObject(deleted.storageKey);\n      } catch (e) {\n        console.error("[files.delete] bucket delete failed:", e);\n      }\n\n      await logAudit({\n        eventType: "file.delete",\n        context: ctx,\n        targetType: "file",\n        targetId: deleted.id,\n        metadata: { filename: deleted.filename },\n      });'''
replace_once('server/routes/files.ts', old_delete, new_delete)

# ---------------------------------------------------------------------------
# 4) Express auth: contador falho e rotação refresh devem ser atômicos também.
# ---------------------------------------------------------------------------
replace_once(
    'server/auth/routes.ts',
    'import { eq, and, isNull } from "drizzle-orm";',
    'import { eq, and, isNull, lte, or, sql } from "drizzle-orm";',
)
replace_once(
    'server/auth/routes.ts',
    'import { DUMMY_BCRYPT_HASH, hashPassword, verifyPassword, shouldLockoutAccount, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";',
    'import { DUMMY_BCRYPT_HASH, PASSWORD_POLICY, hashPassword, verifyPassword, calculateLockoutUntil, isAccountLocked } from "../lib/password.js";',
)

old_failed = '''        if (user && user.isActive && !locked && !valid) {\n          const newAttempts = user.failedLoginAttempts + 1;\n          const updates: any = { failedLoginAttempts: newAttempts };\n          if (shouldLockoutAccount(newAttempts)) {\n            updates.lockedUntil = calculateLockoutUntil();\n            await logAudit({\n              eventType: "auth.account.locked",\n              context: ctx,\n              targetType: "user",\n              targetId: user.id,\n              metadata: { attempts: newAttempts },\n              success: false,\n            });\n          }\n          db.update(users).set(updates).where(eq(users.id, user.id)).run();\n        }'''
new_failed = '''        if (user && user.isActive && !locked && !valid) {\n          const now = new Date().toISOString();\n          const lockUntil = calculateLockoutUntil();\n          const updated = db.update(users)\n            .set({\n              failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,\n              lockedUntil: sql`CASE\n                WHEN COALESCE(${users.failedLoginAttempts}, 0) + 1 >= ${PASSWORD_POLICY.maxFailedAttempts}\n                THEN ${lockUntil}\n                ELSE ${users.lockedUntil}\n              END`,\n            })\n            .where(and(\n              eq(users.id, user.id),\n              eq(users.isActive, true),\n              or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),\n            ))\n            .returning({\n              failedLoginAttempts: users.failedLoginAttempts,\n              lockedUntil: users.lockedUntil,\n            })\n            .get();\n          if (\n            updated &&\n            updated.failedLoginAttempts >= PASSWORD_POLICY.maxFailedAttempts &&\n            updated.lockedUntil\n          ) {\n            await logAudit({\n              eventType: "auth.account.locked",\n              context: ctx,\n              targetType: "user",\n              targetId: user.id,\n              metadata: { attempts: updated.failedLoginAttempts },\n              success: false,\n            });\n          }\n        }'''
replace_once('server/auth/routes.ts', old_failed, new_failed)

old_success = '''      // Sucesso: zera tentativas, atualiza lastLogin, emite tokens\n      db.update(users)\n        .set({\n          failedLoginAttempts: 0,\n          lockedUntil: null,\n          lastLoginAt: new Date().toISOString(),\n        })\n        .where(eq(users.id, user.id))\n        .run();\n\n      const accessToken = signAccessToken({\n        userId: user.id,\n        email: user.email,\n        role: user.role,\n        name: user.name,\n      });\n\n      const refresh = issueRefreshToken();\n      db.insert(refreshTokens)\n        .values({\n          userId: user.id,\n          tokenHash: refresh.tokenHash,\n          expiresAt: refresh.expiresAt,\n          ipAddress: ctx.ipAddress,\n          userAgent: ctx.userAgent,\n        })\n        .run();'''
new_success = '''      // Sucesso só é aceito se a conta continuar ativa/desbloqueada depois do\n      // bcrypt. Atualização de estado + criação do refresh acontecem na mesma tx.\n      const now = new Date().toISOString();\n      const refresh = issueRefreshToken();\n      const accepted = db.transaction((tx) => {\n        const live = tx.update(users)\n          .set({\n            failedLoginAttempts: 0,\n            lockedUntil: null,\n            lastLoginAt: now,\n          })\n          .where(and(\n            eq(users.id, user.id),\n            eq(users.isActive, true),\n            or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),\n          ))\n          .returning({ id: users.id })\n          .get();\n        if (!live) return false;\n        tx.insert(refreshTokens)\n          .values({\n            userId: user.id,\n            tokenHash: refresh.tokenHash,\n            expiresAt: refresh.expiresAt,\n            ipAddress: ctx.ipAddress,\n            userAgent: ctx.userAgent,\n          })\n          .run();\n        return true;\n      });\n      if (!accepted) {\n        return res.status(401).json({ error: "Credenciais invalidas", code: "AUTH_INVALID" });\n      }\n\n      const accessToken = signAccessToken({\n        userId: user.id,\n        email: user.email,\n        role: user.role,\n        name: user.name,\n      });'''
replace_once('server/auth/routes.ts', old_success, new_success)

old_rotation = '''      const user = db.select().from(users).where(eq(users.id, stored.userId)).get();\n      if (!user || !user.isActive) {\n        return res.status(401).json({ error: "Usuario inativo", code: "USER_INACTIVE" });\n      }\n\n      // Rotacao: emite novo refresh, revoga antigo\n      const newRefresh = issueRefreshToken();\n      const newRefreshRow = db\n        .insert(refreshTokens)\n        .values({\n          userId: user.id,\n          tokenHash: newRefresh.tokenHash,\n          expiresAt: newRefresh.expiresAt,\n          ipAddress: ctx.ipAddress,\n          userAgent: ctx.userAgent,\n        })\n        .returning()\n        .get();\n\n      db.update(refreshTokens)\n        .set({ revokedAt: new Date().toISOString(), rotatedToTokenId: newRefreshRow.id })\n        .where(eq(refreshTokens.id, stored.id))\n        .run();\n\n      const accessToken = signAccessToken({\n        userId: user.id,\n        email: user.email,\n        role: user.role,\n        name: user.name,\n      });'''
new_rotation = '''      const newRefresh = issueRefreshToken();\n      let rotation: { user: typeof users.$inferSelect } | null = null;\n      try {\n        rotation = db.transaction((tx) => {\n          const current = tx.select().from(refreshTokens)\n            .where(and(eq(refreshTokens.id, stored.id), isNull(refreshTokens.revokedAt)))\n            .get();\n          if (!current || current.tokenHash !== tokenHash || new Date(current.expiresAt).getTime() < Date.now()) {\n            throw new Error("REFRESH_RACE");\n          }\n          const liveUser = tx.select().from(users).where(and(eq(users.id, current.userId), eq(users.isActive, true))).get();\n          if (!liveUser) throw new Error("REFRESH_USER_INACTIVE");\n\n          const newRefreshRow = tx\n            .insert(refreshTokens)\n            .values({\n              userId: liveUser.id,\n              tokenHash: newRefresh.tokenHash,\n              expiresAt: newRefresh.expiresAt,\n              ipAddress: ctx.ipAddress,\n              userAgent: ctx.userAgent,\n            })\n            .returning()\n            .get();\n\n          const revoked = tx.update(refreshTokens)\n            .set({ revokedAt: new Date().toISOString(), rotatedToTokenId: newRefreshRow.id })\n            .where(and(eq(refreshTokens.id, current.id), isNull(refreshTokens.revokedAt)))\n            .run();\n          if (revoked.changes !== 1) throw new Error("REFRESH_RACE");\n          return { user: liveUser };\n        });\n      } catch (error) {\n        const code = error instanceof Error ? error.message : "";\n        if (code === "REFRESH_USER_INACTIVE") {\n          return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });\n        }\n        if (code === "REFRESH_RACE") {\n          db.update(refreshTokens)\n            .set({ revokedAt: new Date().toISOString() })\n            .where(and(eq(refreshTokens.userId, stored.userId), isNull(refreshTokens.revokedAt)))\n            .run();\n          await logAudit({\n            eventType: "auth.token.refresh",\n            context: { ...ctx, userId: stored.userId },\n            targetType: "user",\n            targetId: stored.userId,\n            metadata: { reason: "refresh_race_or_reuse_detected" },\n            success: false,\n          });\n          return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });\n        }\n        throw error;\n      }\n      if (!rotation) {\n        return res.status(401).json({ error: "Refresh token invalido", code: "REFRESH_INVALID" });\n      }\n      const user = rotation.user;\n\n      const accessToken = signAccessToken({\n        userId: user.id,\n        email: user.email,\n        role: user.role,\n        name: user.name,\n      });'''
replace_once('server/auth/routes.ts', old_rotation, new_rotation)

# ---------------------------------------------------------------------------
# 5) Regressões permanentes.
# ---------------------------------------------------------------------------
(ROOT / 'tests/unit/runtime-config.test.ts').write_text('''import assert from "node:assert/strict";\nimport { boundedIntegerEnv, requiredBoundedIntegerEnv, RuntimeConfigurationError } from "../../server/lib/runtimeConfig";\n\nconst prior = { ...process.env };\ntry {\n  delete process.env.TEST_BOUNDED_INT;\n  assert.equal(boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), 7);\n  process.env.TEST_BOUNDED_INT = "9";\n  assert.equal(boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), 9);\n  for (const value of ["NaN", "3x", "0", "11", "1.5", "-2", "999999999999999999999999"]) {\n    process.env.TEST_BOUNDED_INT = value;\n    assert.throws(() => boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), RuntimeConfigurationError);\n  }\n  delete process.env.TEST_BOUNDED_INT;\n  assert.throws(() => requiredBoundedIntegerEnv("TEST_BOUNDED_INT", 1, 10), RuntimeConfigurationError);\n} finally {\n  process.env = prior;\n}\nconsole.log("✓ configuração numérica rejeita NaN, frações e valores fora da faixa");\n''', 'utf-8')

(ROOT / 'tests/unit/file-storage-race-regression.test.mjs').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\n\nconst routes = fs.readFileSync("server/routes/files.ts", "utf8");\nconst storage = fs.readFileSync("server/lib/cloudStorage.ts", "utf8");\n\nassert.match(routes, /freshPatient[\\s\\S]{0,900}patientReferenceDecision/, "upload deve revalidar paciente após URL assinada");\nassert.match(routes, /headObject[\\s\\S]{0,1800}eq\\(filesTable\\.isDeleted, false\\)[\\s\\S]{0,500}FILE_STATE_CHANGED/, "confirm deve rejeitar arquivo apagado durante HEAD");\nassert.match(routes, /getDownloadSignedUrl[\\s\\S]{0,700}freshFile[\\s\\S]{0,500}freshFile\\.isDeleted/, "download deve revalidar estado depois da I/O de assinatura");\nassert.match(routes, /const deleted = db\\.update[\\s\\S]{0,700}eq\\(filesTable\\.isDeleted, false\\)[\\s\\S]{0,700}await deleteObject\\(deleted\\.storageKey\\)/, "delete deve revogar DB antes da I/O de bucket");\nassert.match(routes, /STORAGE_UNAVAILABLE/);\nassert.match(storage, /isStorageNotFoundError/);\nassert.match(storage, /httpStatusCode === 404/);\nassert.match(storage, /throw new CloudStorageError\\("Falha ao consultar o objeto no storage\\."\\)/);\n\nconsole.log("✓ arquivos: TOCTOU, soft-delete e indisponibilidade de storage protegidos");\n''', 'utf-8')

(ROOT / 'tests/unit/express-auth-race-regression.test.mjs').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\n\nconst auth = fs.readFileSync("server/auth/routes.ts", "utf8");\nassert.match(auth, /failedLoginAttempts: sql`COALESCE/);\nassert.match(auth, /PASSWORD_POLICY\\.maxFailedAttempts/);\nassert.match(auth, /const accepted = db\\.transaction/);\nassert.match(auth, /eq\\(users\\.isActive, true\\)/);\nassert.match(auth, /const newRefreshRow = tx[\\s\\S]{0,800}const revoked = tx\\.update/);\nassert.match(auth, /revoked\\.changes !== 1/);\nassert.match(auth, /REFRESH_RACE/);\nassert.match(auth, /refresh_race_or_reuse_detected/);\nconsole.log("✓ Express auth: lockout, login e rotação de refresh são protegidos contra corrida");\n''', 'utf-8')

# Garante que novas regressões fazem parte da catraca permanente.
p = ROOT / 'package.json'
s = p.read_text('utf-8')
old = '"test:quick-wins": "node --import tsx tests/unit/auth-hardening-regressions.test.ts &&'
new = '"test:quick-wins": "node --import tsx tests/unit/runtime-config.test.ts && node tests/unit/file-storage-race-regression.test.mjs && node tests/unit/express-auth-race-regression.test.mjs && node --import tsx tests/unit/auth-hardening-regressions.test.ts &&'
if old not in s:
    raise SystemExit('quick-wins anchor round2 missing')
p.write_text(s.replace(old, new, 1), 'utf-8')

print('Round 2 definitive fixes applied')
