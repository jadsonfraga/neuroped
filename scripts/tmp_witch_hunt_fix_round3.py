from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:160]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

# 1) Filtro final de auditoria usa próximo dia exclusivo para não perder frações
# do último segundo (ex.: 23:59:59.999Z).
replace_once(
    'functions/api/audit-log.ts',
    '''function isRealIsoDay(value: string): boolean {\n  const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);\n  if (!match) return false;\n  const year = Number(match[1]);\n  const month = Number(match[2]);\n  const day = Number(match[3]);\n  const date = new Date(Date.UTC(year, month - 1, day));\n  return (\n    date.getUTCFullYear() === year &&\n    date.getUTCMonth() === month - 1 &&\n    date.getUTCDate() === day\n  );\n}\n''',
    '''function isRealIsoDay(value: string): boolean {\n  const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);\n  if (!match) return false;\n  const year = Number(match[1]);\n  const month = Number(match[2]);\n  const day = Number(match[3]);\n  const date = new Date(Date.UTC(year, month - 1, day));\n  return (\n    date.getUTCFullYear() === year &&\n    date.getUTCMonth() === month - 1 &&\n    date.getUTCDate() === day\n  );\n}\n\nexport function nextAuditIsoDay(value: string): string | null {\n  if (!isRealIsoDay(value)) return null;\n  const [year, month, day] = value.split("-").map(Number);\n  const date = new Date(Date.UTC(year, month - 1, day + 1));\n  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;\n}\n''',
)
replace_once(
    'functions/api/audit-log.ts',
    '''    if (to) { sql += " AND created_at <= ?"; binds.push(to + "T23:59:59Z"); }''',
    '''    if (to) {\n      const toExclusive = nextAuditIsoDay(to);\n      if (!toExclusive) return errorResponse("Data final inválida.", "VALIDATION_ERROR", 400);\n      sql += " AND created_at < ?";\n      binds.push(toExclusive);\n    }''',
)

# 2) Dashboard operacional: calcular agora/local antes de buscar appointments e
# ordenar a lista limitada priorizando próximos agendamentos ativos.
replace_once(
    'functions/api/operations/index.ts',
    '''  const profile = await ensureProviderProfile(db, provider);\n  const servicesResult = await db''',
    '''  const profile = await ensureProviderProfile(db, provider);\n  const nowMinute = localNow(profile.timezone);\n  const today = nowMinute.slice(0, 10);\n  const next30 = addDaysLocalMinute(nowMinute, 30);\n  const prior30 = addDaysLocalMinute(nowMinute, -30);\n\n  const servicesResult = await db''',
)
replace_once(
    'functions/api/operations/index.ts',
    '''        WHERE a.provider_user_id = ?\n        ORDER BY a.starts_at_local DESC\n        LIMIT 250`,\n    )\n    .bind(provider.id)''',
    '''        WHERE a.provider_user_id = ?\n        ORDER BY\n          CASE\n            WHEN a.starts_at_local >= ?\n             AND a.status IN ('requested','confirmed','checked_in','in_care')\n            THEN 0 ELSE 1\n          END ASC,\n          CASE\n            WHEN a.starts_at_local >= ?\n             AND a.status IN ('requested','confirmed','checked_in','in_care')\n            THEN a.starts_at_local\n          END ASC,\n          a.starts_at_local DESC\n        LIMIT 250`,\n    )\n    .bind(provider.id, nowMinute, nowMinute)''',
)

# 3) Métricas não podem depender dos LIMITs usados para renderização do painel.
replace_once(
    'functions/api/operations/index.ts',
    '''  const nowMinute = localNow(profile.timezone);\n  const today = nowMinute.slice(0, 10);\n  const next30 = addDaysLocalMinute(nowMinute, 30);\n  const prior30 = addDaysLocalMinute(nowMinute, -30);\n  const metrics = {\n    today: fullAppointments.filter((item) => item.startsAtLocal.startsWith(today) && !["cancelled", "no_show"].includes(item.status)).length,\n    upcoming: fullAppointments.filter((item) => item.startsAtLocal >= nowMinute && !["cancelled", "completed", "no_show"].includes(item.status)).length,\n    requested: fullAppointments.filter((item) => item.status === "requested").length,\n    waitlist: waitlist.filter((item) => item.status === "waiting").length,\n    pendingReviews: principal.canConfigure ? fullReviews.filter((item) => !item.approved).length : 0,\n    pendingNotifications: notifications.filter((item) => item.status === "pending_provider").length,\n    expectedCents: principal.canConfigure\n      ? fullAppointments\n          .filter((item) => item.startsAtLocal >= nowMinute && item.startsAtLocal <= next30 && !["cancelled", "no_show"].includes(item.status))\n          .reduce((sum, item) => sum + (item.amountCents ?? 0), 0)\n      : 0,\n    paidCents: principal.canConfigure\n      ? fullAppointments.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + (item.amountCents ?? 0), 0)\n      : 0,\n    noShow30d: fullAppointments.filter((item) => item.status === "no_show" && item.startsAtLocal >= prior30 && item.startsAtLocal <= nowMinute).length,\n  };''',
    '''  const [appointmentMetrics, waitlistMetrics, reviewMetrics, notificationMetrics] = await Promise.all([\n    db.prepare(\n      `SELECT\n         COALESCE(SUM(CASE WHEN substr(starts_at_local, 1, 10) = ? AND status NOT IN ('cancelled','no_show') THEN 1 ELSE 0 END), 0) AS today_count,\n         COALESCE(SUM(CASE WHEN starts_at_local >= ? AND status IN ('requested','confirmed','checked_in','in_care') THEN 1 ELSE 0 END), 0) AS upcoming_count,\n         COALESCE(SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END), 0) AS requested_count,\n         COALESCE(SUM(CASE WHEN status = 'no_show' AND starts_at_local >= ? AND starts_at_local <= ? THEN 1 ELSE 0 END), 0) AS no_show_30d,\n         COALESCE(SUM(CASE WHEN starts_at_local >= ? AND starts_at_local <= ? AND status NOT IN ('cancelled','no_show') THEN COALESCE(amount_cents, 0) ELSE 0 END), 0) AS expected_cents,\n         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(amount_cents, 0) ELSE 0 END), 0) AS paid_cents\n       FROM appointments\n      WHERE provider_user_id = ?`,\n    ).bind(today, nowMinute, prior30, nowMinute, nowMinute, next30, provider.id).first<{\n      today_count: number; upcoming_count: number; requested_count: number; no_show_30d: number;\n      expected_cents: number; paid_cents: number;\n    }>(),\n    db.prepare(\n      `SELECT COUNT(*) AS count FROM waitlist_entries WHERE provider_user_id = ? AND status = 'waiting'`,\n    ).bind(provider.id).first<{ count: number }>(),\n    db.prepare(\n      `SELECT COUNT(*) AS count FROM appointment_reviews WHERE provider_user_id = ? AND approved = 0`,\n    ).bind(provider.id).first<{ count: number }>(),\n    db.prepare(\n      `SELECT COUNT(*) AS count FROM notification_outbox WHERE provider_user_id = ? AND status = 'pending_provider'`,\n    ).bind(provider.id).first<{ count: number }>(),\n  ]);\n\n  const metrics = {\n    today: appointmentMetrics?.today_count ?? 0,\n    upcoming: appointmentMetrics?.upcoming_count ?? 0,\n    requested: appointmentMetrics?.requested_count ?? 0,\n    waitlist: waitlistMetrics?.count ?? 0,\n    pendingReviews: principal.canConfigure ? (reviewMetrics?.count ?? 0) : 0,\n    pendingNotifications: notificationMetrics?.count ?? 0,\n    expectedCents: principal.canConfigure ? (appointmentMetrics?.expected_cents ?? 0) : 0,\n    paidCents: principal.canConfigure ? (appointmentMetrics?.paid_cents ?? 0) : 0,\n    noShow30d: appointmentMetrics?.no_show_30d ?? 0,\n  };''',
)

# Testes permanentes: último segundo do dia e métricas independentes do LIMIT.
p = ROOT / 'tests/unit/audit-log-contract.test.ts'
s = p.read_text('utf-8')
s = s.replace(
    'import { onRequestGet, parseAuditLogQuery } from "../../functions/api/audit-log";',
    'import { nextAuditIsoDay, onRequestGet, parseAuditLogQuery } from "../../functions/api/audit-log";',
)
anchor = 'assert.equal("data" in payload, false, "falha sem DB não pode expor logs fictícios");\n'
addition = anchor + '''assert.equal(nextAuditIsoDay("2026-02-28"), "2026-03-01");\nassert.equal(nextAuditIsoDay("2024-02-28"), "2024-02-29");\nassert.equal(nextAuditIsoDay("2026-12-31"), "2027-01-01");\n'''
if anchor not in s:
    raise SystemExit('audit test anchor not found')
p.write_text(s.replace(anchor, addition, 1), 'utf-8')

p = ROOT / 'tests/unit/witch-hunt-regressions.test.mjs'
s = p.read_text('utf-8')
anchor = 'assert.match(operations, /transitionResults\\[0\\][\\s\\S]{0,300}STALE_APPOINTMENT/, "transição profissional deve rejeitar leitura obsoleta");\n'
addition = anchor + '''assert.match(operations, /CASE[\\s\\S]{0,500}starts_at_local >= \\?[\\s\\S]{0,500}LIMIT 250/, "lista limitada deve priorizar consultas futuras ativas");\nassert.match(operations, /SELECT[\\s\\S]{0,1200}today_count[\\s\\S]{0,1200}FROM appointments/, "métricas devem ser agregadas no banco completo");\nassert.match(operations, /COUNT\\(\\*\\) AS count FROM waitlist_entries/, "contagem de espera não pode depender do LIMIT visual");\nassert.match(operations, /COUNT\\(\\*\\) AS count FROM appointment_reviews/, "reviews pendentes não podem depender do LIMIT visual");\nassert.match(operations, /COUNT\\(\\*\\) AS count FROM notification_outbox/, "notificações pendentes não podem depender do LIMIT visual");\nassert.doesNotMatch(auditLog, /T23:59:59Z/, "filtro final não pode perder eventos com milissegundos no último segundo");\nassert.match(auditLog, /created_at < \\?/, "data final deve usar próximo dia exclusivo");\n'''
if anchor not in s:
    raise SystemExit('witch test anchor not found')
p.write_text(s.replace(anchor, addition, 1), 'utf-8')

print('Round 3 scale/date fixes applied')
