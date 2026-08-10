from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:140]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

# Helpers de lock que preservam atomicidade do batch sem liberar locks quando
# o UPDATE otimista imediatamente anterior não alterou a consulta.
replace_once(
    'functions/api/operations/_core.ts',
    '''export function releaseSlotLocksStatement(\n  db: D1Database,\n  appointmentId: string,\n): D1PreparedStatement {\n  return db.prepare(`DELETE FROM appointment_slot_locks WHERE appointment_id = ?`).bind(appointmentId);\n}\n''',
    '''export function releaseSlotLocksStatement(\n  db: D1Database,\n  appointmentId: string,\n): D1PreparedStatement {\n  return db.prepare(`DELETE FROM appointment_slot_locks WHERE appointment_id = ?`).bind(appointmentId);\n}\n\n/**\n * Use somente imediatamente após um UPDATE/DELETE condicional no mesmo D1.batch.\n * `changes()` é 1 apenas quando a mutação anterior venceu o controle otimista;\n * assim uma requisição obsoleta não libera os locks de uma transição concorrente.\n */\nexport function releaseSlotLocksAfterSuccessfulMutationStatement(\n  db: D1Database,\n  appointmentId: string,\n): D1PreparedStatement {\n  return db\n    .prepare(`DELETE FROM appointment_slot_locks WHERE appointment_id = ? AND changes() = 1`)\n    .bind(appointmentId);\n}\n\nexport function slotLockStatementsForAppointmentState(\n  db: D1Database,\n  providerUserId: string,\n  appointmentId: string,\n  startsAtLocal: string,\n  endsAtLocal: string,\n  status: AppointmentStatus,\n): D1PreparedStatement[] {\n  return appointmentSlotKeys(startsAtLocal, endsAtLocal).map((slotKey) =>\n    db.prepare(\n      `INSERT INTO appointment_slot_locks (provider_user_id, slot_key, appointment_id)\n       SELECT ?, ?, ?\n        WHERE EXISTS (\n          SELECT 1 FROM appointments\n           WHERE id = ? AND provider_user_id = ? AND status = ?\n             AND starts_at_local = ? AND ends_at_local = ?\n        )`,\n    ).bind(\n      providerUserId,\n      slotKey,\n      appointmentId,\n      appointmentId,\n      providerUserId,\n      status,\n      startsAtLocal,\n      endsAtLocal,\n    ),\n  );\n}\n''',
)

# Booking público: cancelar e remarcar com comparação do estado lido.
replace_once(
    'functions/api/public-booking.ts',
    '''  releaseSlotLocksStatement,\n  serviceToApi,\n  sha256,\n  slotLockStatements,''',
    '''  releaseSlotLocksAfterSuccessfulMutationStatement,\n  serviceToApi,\n  sha256,\n  slotLockStatements,\n  slotLockStatementsForAppointmentState,''',
)
replace_once(
    'functions/api/public-booking.ts',
    '''      const reason = cleanOptionalText(body.reason, 160);\n      await env.DB.batch([\n        env.DB.prepare(\n          `UPDATE appointments SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`,\n        ).bind(now, reason, now, appointment.id),\n        releaseSlotLocksStatement(env.DB, appointment.id),\n      ]);\n      await enqueueNotification(env.DB, env, {''',
    '''      const reason = cleanOptionalText(body.reason, 160);\n      const cancelResults = await env.DB.batch([\n        env.DB.prepare(\n          `UPDATE appointments\n              SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ?\n            WHERE id = ? AND status = ? AND starts_at_local = ? AND ends_at_local = ?`,\n        ).bind(\n          now,\n          reason,\n          now,\n          appointment.id,\n          appointment.status,\n          appointment.starts_at_local,\n          appointment.ends_at_local,\n        ),\n        releaseSlotLocksAfterSuccessfulMutationStatement(env.DB, appointment.id),\n      ]);\n      if ((cancelResults[0]?.meta?.changes ?? 0) !== 1) {\n        return errorResponse("A reserva mudou enquanto era cancelada. Atualize e tente novamente.", "STALE_APPOINTMENT", 409);\n      }\n      await enqueueNotification(env.DB, env, {''',
)
replace_once(
    'functions/api/public-booking.ts',
    '''        const updateAppointment = env.DB.prepare(\n          `UPDATE appointments SET starts_at_local = ?, ends_at_local = ?, status = 'requested', updated_at = ? WHERE id = ?`,\n        ).bind(chosen.startsAtLocal, chosen.endsAtLocal, now, appointment.id);\n        await env.DB.batch([\n          releaseSlotLocksStatement(env.DB, appointment.id),\n          updateAppointment,\n          ...slotLockStatements(env.DB, appointment.provider_user_id, appointment.id, chosen.startsAtLocal, chosen.endsAtLocal),\n        ]);''',
    '''        const updateAppointment = env.DB.prepare(\n          `UPDATE appointments\n              SET starts_at_local = ?, ends_at_local = ?, status = 'requested', updated_at = ?\n            WHERE id = ? AND status = ? AND starts_at_local = ? AND ends_at_local = ?`,\n        ).bind(\n          chosen.startsAtLocal,\n          chosen.endsAtLocal,\n          now,\n          appointment.id,\n          appointment.status,\n          appointment.starts_at_local,\n          appointment.ends_at_local,\n        );\n        const rescheduleResults = await env.DB.batch([\n          updateAppointment,\n          releaseSlotLocksAfterSuccessfulMutationStatement(env.DB, appointment.id),\n          ...slotLockStatementsForAppointmentState(\n            env.DB,\n            appointment.provider_user_id,\n            appointment.id,\n            chosen.startsAtLocal,\n            chosen.endsAtLocal,\n            "requested",\n          ),\n        ]);\n        if ((rescheduleResults[0]?.meta?.changes ?? 0) !== 1) {\n          return errorResponse("A reserva mudou enquanto era remarcada. Atualize e tente novamente.", "STALE_APPOINTMENT", 409);\n        }''',
)

# Agenda profissional: a transição validada deve continuar sendo a transição aplicada.
replace_once(
    'functions/api/operations/index.ts',
    '''  randomAccessToken,\n  releaseSlotLocksStatement,\n  serviceToApi,''',
    '''  randomAccessToken,\n  releaseSlotLocksAfterSuccessfulMutationStatement,\n  serviceToApi,''',
)
replace_once(
    'functions/api/operations/index.ts',
    '''      const updateStatus = env.DB.prepare(\n        `UPDATE appointments SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ?`,\n      ).bind(status, checkedInAt, completedAt, cancelledAt, now, id, user.id);\n      const releasesSchedule = ["cancelled", "no_show", "completed"].includes(status);\n      await env.DB.batch(releasesSchedule ? [updateStatus, releaseSlotLocksStatement(env.DB, id)] : [updateStatus]);\n      await enqueueNotification(env.DB, env, {''',
    '''      const updateStatus = env.DB.prepare(\n        `UPDATE appointments\n            SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ? AND status = ?\n            AND starts_at_local = ? AND ends_at_local = ?`,\n      ).bind(\n        status,\n        checkedInAt,\n        completedAt,\n        cancelledAt,\n        now,\n        id,\n        user.id,\n        current.status,\n        current.starts_at_local,\n        current.ends_at_local,\n      );\n      const releasesSchedule = ["cancelled", "no_show", "completed"].includes(status);\n      const transitionResults = await env.DB.batch(\n        releasesSchedule\n          ? [updateStatus, releaseSlotLocksAfterSuccessfulMutationStatement(env.DB, id)]\n          : [updateStatus],\n      );\n      if ((transitionResults[0]?.meta?.changes ?? 0) !== 1) {\n        return errorResponse("A consulta mudou durante a atualização. Recarregue a agenda.", "STALE_APPOINTMENT", 409);\n      }\n      await enqueueNotification(env.DB, env, {''',
)

# Teste estático permanente da invariância concorrente.
test = ROOT / 'tests/unit/witch-hunt-regressions.test.mjs'
s = test.read_text('utf-8')
anchor = 'assert.doesNotMatch(auditLog, /DEMO_LOGS|Log de auditoria simulado/, "audit-log admin não pode degradar para fixture pública");\n'
addition = anchor + '''\nconst publicBooking = read("functions/api/public-booking.ts");\nconst core = read("functions/api/operations/_core.ts");\nassert.match(core, /changes\\(\\) = 1/, "liberação de locks deve depender da mutação imediatamente anterior");\nassert.match(publicBooking, /cancelResults\\[0\\][\\s\\S]{0,300}STALE_APPOINTMENT/, "cancelamento público deve detectar corrida de estado");\nassert.match(publicBooking, /rescheduleResults\\[0\\][\\s\\S]{0,300}STALE_APPOINTMENT/, "remarcação pública deve detectar corrida de estado");\nassert.match(publicBooking, /WHERE id = \\? AND status = \\? AND starts_at_local = \\? AND ends_at_local = \\?/, "mutações públicas devem comparar o estado lido");\nassert.match(publicBooking, /slotLockStatementsForAppointmentState/, "remarcação deve readquirir locks somente para o estado efetivamente gravado");\nassert.match(operations, /transitionResults\\[0\\][\\s\\S]{0,300}STALE_APPOINTMENT/, "transição profissional deve rejeitar leitura obsoleta");\n'''
if anchor not in s:
    raise SystemExit('teste witch-hunt: âncora não encontrada')
test.write_text(s.replace(anchor, addition, 1), 'utf-8')

print('Round 2 concurrency fixes applied')
