from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:120]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

# 1-3) Audit log: remover fail-open demo, paginação NaN e filtros de data malformados.
p = ROOT / 'functions/api/audit-log.ts'
s = p.read_text('utf-8')
start = s.index('const DEMO_LOGS = [')
end = s.index('\n\nexport const onRequestGet', start)
s = s[:start] + '''function positiveInteger(value: string | null, fallback: number, maximum: number): number {\n  if (value === null || !/^\\d+$/.test(value)) return fallback;\n  const parsed = Number(value);\n  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;\n  return Math.min(parsed, maximum);\n}\n\nfunction isRealIsoDay(value: string): boolean {\n  const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);\n  if (!match) return false;\n  const year = Number(match[1]);\n  const month = Number(match[2]);\n  const day = Number(match[3]);\n  const date = new Date(Date.UTC(year, month - 1, day));\n  return (\n    date.getUTCFullYear() === year &&\n    date.getUTCMonth() === month - 1 &&\n    date.getUTCDate() === day\n  );\n}\n\nexport function parseAuditLogQuery(url: URL):\n  | { ok: true; page: number; limit: number; resource?: string; action?: string; from?: string; to?: string }\n  | { ok: false; message: string } {\n  const page = positiveInteger(url.searchParams.get("page"), 1, 1_000_000);\n  const limit = positiveInteger(url.searchParams.get("limit"), 50, 100);\n  const resource = url.searchParams.get("resource")?.trim() || undefined;\n  const action = url.searchParams.get("action")?.trim() || undefined;\n  const from = url.searchParams.get("from")?.trim() || undefined;\n  const to = url.searchParams.get("to")?.trim() || undefined;\n\n  if ((resource?.length ?? 0) > 120 || (action?.length ?? 0) > 160) {\n    return { ok: false, message: "Filtro textual excede o limite permitido." };\n  }\n  if (from && !isRealIsoDay(from)) return { ok: false, message: "Data inicial inválida." };\n  if (to && !isRealIsoDay(to)) return { ok: false, message: "Data final inválida." };\n  if (from && to && from > to) return { ok: false, message: "Intervalo de datas inválido." };\n\n  return { ok: true, page, limit, resource, action, from, to };\n}\n''' + s[end:]
p.write_text(s, 'utf-8')

replace_once(
    'functions/api/audit-log.ts',
    '''  const url = new URL(request.url);\n  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));\n  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));\n  const resource = url.searchParams.get("resource")?.trim();\n  const action = url.searchParams.get("action")?.trim();\n  const from = url.searchParams.get("from")?.trim();\n  const to = url.searchParams.get("to")?.trim();\n\n  if (!env.DB) {\n    return jsonResponse({\n      data: DEMO_LOGS,\n      total: DEMO_LOGS.length,\n      page,\n      limit,\n      mode: "demo",\n      note: "Log de auditoria simulado. Configure D1 para log real.",\n    });\n  }\n\n  try {''',
    '''  const url = new URL(request.url);\n  const query = parseAuditLogQuery(url);\n  if (!query.ok) return errorResponse(query.message, "VALIDATION_ERROR", 400);\n  const { page, limit, resource, action, from, to } = query;\n\n  // Log de auditoria nunca deve degradar para dados fictícios. Sem o banco que\n  // sustenta autenticação e trilha real, a superfície administrativa falha fechada.\n  if (!env.DB) {\n    return errorResponse("Log de auditoria indisponível sem banco persistente.", "DB_REQUIRED", 503);\n  }\n\n  try {''',
)

# 4) Conecta Cloudflare: corrida entre SELECT e DELETE não pode responder ok/auditar sucesso.
replace_once(
    'functions/api/conecta/[id].ts',
    '''    await env.DB.prepare("DELETE FROM conecta_events_demo WHERE id = ?").bind(id).run();\n    return json({ ok: true });''',
    '''    const deletion = await env.DB.prepare("DELETE FROM conecta_events_demo WHERE id = ?").bind(id).run();\n    if ((deletion.meta?.changes ?? 0) !== 1) {\n      return error("Registro não encontrado.", "NOT_FOUND", 404);\n    }\n    return json({ ok: true });''',
)

# 5) Conecta Express: mesma proteção contra TOCTOU/falso sucesso.
replace_once(
    'server/routes/conecta.ts',
    '''      sqlite.prepare("DELETE FROM conecta_events WHERE id = ?").run(id);\n      await logAudit({''',
    '''      const deletion = sqlite.prepare("DELETE FROM conecta_events WHERE id = ?").run(id);\n      if (deletion.changes !== 1) {\n        return res.status(404).json({ error: "Registro não encontrado", code: "NOT_FOUND" });\n      }\n      await logAudit({''',
)

# 6) Vínculo da recepção: se a linha desaparecer entre leitura e UPDATE, tentar INSERT.
replace_once(
    'functions/api/operations/_access.ts',
    '''  if (existing) {\n    await db\n      .prepare(\n        `UPDATE booking_staff_links\n            SET active = 1, created_by_user_id = ?, updated_at = ?\n          WHERE provider_user_id = ? AND staff_user_id = ?`,\n      )\n      .bind(principal.actorUserId, now, principal.providerUserId, staff.id)\n      .run();\n    return { ok: true, staffUserId: staff.id };\n  }\n\n  try {''',
    '''  if (existing) {\n    const update = await db\n      .prepare(\n        `UPDATE booking_staff_links\n            SET active = 1, created_by_user_id = ?, updated_at = ?\n          WHERE provider_user_id = ? AND staff_user_id = ?`,\n      )\n      .bind(principal.actorUserId, now, principal.providerUserId, staff.id)\n      .run();\n    if ((update.meta?.changes ?? 0) === 1) {\n      return { ok: true, staffUserId: staff.id };\n    }\n    // A linha pode ter sido removida depois do SELECT; nesse caso seguimos para\n    // o INSERT protegido pela constraint/checagem de vencedor abaixo.\n  }\n\n  try {''',
)

# 7) Perfil e serviço: não auditar sucesso se linha desaparecer entre leitura/garantia e UPDATE.
replace_once(
    'functions/api/operations/index.ts',
    '''        await env.DB.prepare(\n          `UPDATE booking_provider_profiles\n              SET slug = ?, display_name = ?, specialty = ?, location_label = ?, timezone = ?, booking_enabled = ?, updated_at = ?\n            WHERE user_id = ?`,\n        ).bind(requestedSlug, displayName, specialty, locationLabel, timezone, bookingEnabled, now, user.id).run();''',
    '''        const update = await env.DB.prepare(\n          `UPDATE booking_provider_profiles\n              SET slug = ?, display_name = ?, specialty = ?, location_label = ?, timezone = ?, booking_enabled = ?, updated_at = ?\n            WHERE user_id = ?`,\n        ).bind(requestedSlug, displayName, specialty, locationLabel, timezone, bookingEnabled, now, user.id).run();\n        if ((update.meta?.changes ?? 0) !== 1) {\n          return errorResponse("Perfil público não encontrado.", "NOT_FOUND", 404);\n        }''',
)
replace_once(
    'functions/api/operations/index.ts',
    '''      await env.DB.prepare(\n        `UPDATE booking_services\n            SET name = ?, duration_minutes = ?, price_cents = ?, modality = ?, active = ?, public_visible = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ?`,\n      ).bind(name, duration, priceCents, modality, active, publicVisible, now, id, user.id).run();\n      auditTargetType = "service";''',
    '''      const update = await env.DB.prepare(\n        `UPDATE booking_services\n            SET name = ?, duration_minutes = ?, price_cents = ?, modality = ?, active = ?, public_visible = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ?`,\n      ).bind(name, duration, priceCents, modality, active, publicVisible, now, id, user.id).run();\n      if ((update.meta?.changes ?? 0) !== 1) return errorResponse("Serviço não encontrado.", "NOT_FOUND", 404);\n      auditTargetType = "service";''',
)

# Testes permanentes.
(ROOT / 'tests/unit/audit-log-contract.test.ts').write_text('''import assert from "node:assert/strict";\nimport { onRequestGet, parseAuditLogQuery } from "../../functions/api/audit-log";\n\nconst sane = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=abc&limit=-5"));\nassert.equal(sane.ok, true);\nif (sane.ok) {\n  assert.equal(sane.page, 1, "page inválida deve cair no fallback seguro");\n  assert.equal(sane.limit, 50, "limit inválido deve cair no fallback seguro");\n}\n\nconst capped = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=999999999999999999999&limit=999"));\nassert.equal(capped.ok, true);\nif (capped.ok) {\n  assert.equal(capped.page, 1, "inteiro fora do intervalo seguro não pode virar Infinity/NaN");\n  assert.equal(capped.limit, 100, "limit numérico deve respeitar teto");\n}\n\nfor (const query of [\n  "from=2026-02-31",\n  "to=2026-13-01",\n  "from=2026-08-11&to=2026-08-10",\n]) {\n  assert.equal(\n    parseAuditLogQuery(new URL(`https://neuroped.invalid/api/audit-log?${query}`)).ok,\n    false,\n    `${query}: intervalo/data inválido deve ser rejeitado`,\n  );\n}\n\nconst noDb = await onRequestGet({\n  env: {},\n  request: new Request("https://neuroped.invalid/api/audit-log"),\n  data: {},\n} as never);\nassert.equal(noDb.status, 503, "log administrativo sem D1 deve falhar fechado");\nconst payload = await noDb.json() as { code?: string; data?: unknown };\nassert.equal(payload.code, "DB_REQUIRED");\nassert.equal("data" in payload, false, "falha sem DB não pode expor logs fictícios");\n\nconsole.log("✓ audit-log falha fechado e normaliza paginação/filtros sem NaN ou datas impossíveis");\n''', 'utf-8')

# Regressão estática para as corridas de exclusão/UPDATE.
(ROOT / 'tests/unit/witch-hunt-regressions.test.mjs').write_text('''import assert from "node:assert/strict";\nimport fs from "node:fs";\n\nconst read = (path) => fs.readFileSync(path, "utf8");\nconst cfConecta = read("functions/api/conecta/[id].ts");\nconst exConecta = read("server/routes/conecta.ts");\nconst access = read("functions/api/operations/_access.ts");\nconst operations = read("functions/api/operations/index.ts");\nconst auditLog = read("functions/api/audit-log.ts");\n\nassert.match(cfConecta, /deletion\.meta\?\.changes[\\s\\S]*NOT_FOUND/, "Conecta D1 deve confirmar remoção real");\nassert.match(exConecta, /deletion\.changes !== 1[\\s\\S]*NOT_FOUND/, "Conecta Express deve confirmar remoção real");\nassert.match(access, /update\.meta\?\.changes[\\s\\S]*seguir para[\\s\\S]*INSERT/, "vínculo staff deve sobreviver à corrida SELECT→UPDATE");\nassert.match(operations, /UPDATE booking_provider_profiles[\\s\\S]{0,700}update\.meta\?\.changes/, "perfil deve confirmar linha atualizada");\nassert.match(operations, /UPDATE booking_services[\\s\\S]{0,700}update\.meta\?\.changes/, "serviço deve confirmar linha atualizada");\nassert.doesNotMatch(auditLog, /DEMO_LOGS|Log de auditoria simulado/, "audit-log admin não pode degradar para fixture pública");\n\nconsole.log("✓ caça a bugs: corridas e fail-open administrativos protegidos");\n''', 'utf-8')

# Adiciona os novos testes à catraca permanente.
package = ROOT / 'package.json'
ps = package.read_text('utf-8')
old = '"test:quick-wins": "node --import tsx tests/unit/secure-storage.test.ts'
new = '"test:quick-wins": "node --import tsx tests/unit/audit-log-contract.test.ts && node tests/unit/witch-hunt-regressions.test.mjs && node --import tsx tests/unit/secure-storage.test.ts'
if old not in ps:
    raise SystemExit('package.json: test:quick-wins não encontrado')
package.write_text(ps.replace(old, new, 1), 'utf-8')

print('Round 1 fixes applied')
