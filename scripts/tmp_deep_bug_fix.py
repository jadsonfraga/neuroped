from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text("utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: esperado 1 trecho, encontrado {count}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1), "utf-8")


# 1) Middleware: o bridge BoaConsulta usa multipart/form-data e estava sendo
# bloqueado pelo contrato JSON global antes de alcançar o handler dedicado.
replace_once(
    "functions/api/_middleware.ts",
    '''  if (["POST", "PATCH", "PUT"].includes(request.method)) {\n    const ct = request.headers.get("Content-Type") ?? "";\n    if (!ct.includes("application/json")) {\n      return new Response(JSON.stringify({ error: "Content-Type deve ser application/json", code: "INVALID_CONTENT_TYPE" }), {\n        status: 415,\n        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },\n      });\n    }\n  }''',
    '''  if (["POST", "PATCH", "PUT"].includes(request.method)) {\n    const ct = (request.headers.get("Content-Type") ?? "").toLowerCase();\n    const bodyPath = new URL(request.url).pathname.replace(/\\/+$/, "") || "/";\n    const multipartAllowed =\n      request.method === "POST" &&\n      bodyPath === "/api/integrations/boaconsulta/import" &&\n      ct.includes("multipart/form-data");\n    if (!ct.includes("application/json") && !multipartAllowed) {\n      return new Response(JSON.stringify({ error: "Content-Type deve ser application/json", code: "INVALID_CONTENT_TYPE" }), {\n        status: 415,\n        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },\n      });\n    }\n  }''',
)

# 2) Datas da agenda: regex sozinha aceitava datas/horas impossíveis.
replace_once(
    "shared/operations.ts",
    '''export function isValidLocalDate(value: string): boolean {\n  return /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\nexport function isValidLocalDateTime(value: string): boolean {\n  return /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(value);\n}''',
    '''export function isValidLocalDate(value: string): boolean {\n  const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);\n  if (!match) return false;\n  const year = Number(match[1]);\n  const month = Number(match[2]);\n  const day = Number(match[3]);\n  if (month < 1 || month > 12 || day < 1 || day > 31) return false;\n  const date = new Date(0);\n  date.setUTCHours(0, 0, 0, 0);\n  date.setUTCFullYear(year, month - 1, day);\n  return (\n    date.getUTCFullYear() === year &&\n    date.getUTCMonth() === month - 1 &&\n    date.getUTCDate() === day\n  );\n}\n\nexport function isValidLocalDateTime(value: string): boolean {\n  const match = /^(\\d{4}-\\d{2}-\\d{2})T(\\d{2}):(\\d{2})$/.exec(value);\n  if (!match || !isValidLocalDate(match[1])) return false;\n  const hour = Number(match[2]);\n  const minute = Number(match[3]);\n  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;\n}\n\nexport function isValidTimeZone(value: string): boolean {\n  if (!value.trim() || value.length > 80) return false;\n  try {\n    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));\n    return true;\n  } catch {\n    return false;\n  }\n}\n\nexport function selectFutureSlots(\n  slots: PublicSlot[],\n  currentLocal: string,\n  limit = 96,\n): PublicSlot[] {\n  if (!isValidLocalDateTime(currentLocal)) return [];\n  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(288, limit)) : 96;\n  const seen = new Set<string>();\n  const selected: PublicSlot[] = [];\n  for (const slot of slots) {\n    if (\n      !isValidLocalDateTime(slot.startsAtLocal) ||\n      !isValidLocalDateTime(slot.endsAtLocal) ||\n      slot.endsAtLocal <= slot.startsAtLocal ||\n      slot.startsAtLocal <= currentLocal\n    ) {\n      continue;\n    }\n    const key = `${slot.startsAtLocal}|${slot.endsAtLocal}`;\n    if (seen.has(key)) continue;\n    seen.add(key);\n    selected.push(slot);\n    if (selected.length >= safeLimit) break;\n  }\n  return selected;\n}''',
)

# 3) Slug com exatamente dois caracteres era rejeitado, embora 1 e 3+ fossem aceitos.
replace_once(
    "functions/api/operations/_core.ts",
    '''export function validSlug(value: string): boolean {\n  return /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(value);\n}''',
    '''export function validSlug(value: string): boolean {\n  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(value);\n}''',
)

# 4) Não cortar 96 slots antes do filtro de horários passados.
replace_once(
    "functions/api/operations/_core.ts",
    '''  return slots.slice(0, 96);''',
    '''  return slots;''',
)

# 5) Booking público: filtra futuro/deduplica antes do cap e valida data de espera.
replace_once(
    "functions/api/public-booking.ts",
    '''import { ensureOperationsHardeningSchema } from "./operations/_access";''',
    '''import { ensureOperationsHardeningSchema } from "./operations/_access";\nimport { isValidLocalDate, selectFutureSlots } from "../../shared/operations";''',
)
replace_once(
    "functions/api/public-booking.ts",
    '''      const currentLocal = nowInTimezone(provider.timezone);\n      const slots = (await listAvailableSlots(env.DB, provider.user_id, service, date)).filter(\n        (slot) => slot.startsAtLocal > currentLocal,\n      );\n      return jsonResponse({ slots, bookingEnabled: true, timezone: provider.timezone });''',
    '''      const currentLocal = nowInTimezone(provider.timezone);\n      const slots = selectFutureSlots(\n        await listAvailableSlots(env.DB, provider.user_id, service, date),\n        currentLocal,\n        96,\n      );\n      return jsonResponse({ slots, bookingEnabled: true, timezone: provider.timezone });''',
)
replace_once(
    "functions/api/public-booking.ts",
    '''      const token = randomAccessToken();\n      const id = `wait-${crypto.randomUUID()}`;''',
    '''      const preferredDate = cleanOptionalText(body.preferredDate, 10);\n      if (preferredDate && !isValidLocalDate(preferredDate)) {\n        return errorResponse("Data preferencial inválida.", "VALIDATION_ERROR", 400);\n      }\n      const token = randomAccessToken();\n      const id = `wait-${crypto.randomUUID()}`;''',
)
replace_once(
    "functions/api/public-booking.ts",
    '''        cleanOptionalText(body.preferredDate, 10),''',
    '''        preferredDate,''',
)

# 6) Agenda privada: bloquear timezone inválido e falsos sucessos em IDs inexistentes.
replace_once(
    "functions/api/operations/index.ts",
    '''import type { AppointmentStatus } from "../../../shared/operations";''',
    '''import { isValidTimeZone, type AppointmentStatus } from "../../../shared/operations";''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''      const requestedSlug = cleanText(body.slug, 50) || slugify(displayName || user.name);\n      if (!displayName || !specialty || !validSlug(requestedSlug)) return errorResponse("Perfil público inválido.", "VALIDATION_ERROR", 400);''',
    '''      const requestedSlug = cleanText(body.slug, 50) || slugify(displayName || user.name);\n      if (!isValidTimeZone(timezone)) return errorResponse("Fuso horário inválido.", "VALIDATION_ERROR", 400);\n      if (!displayName || !specialty || !validSlug(requestedSlug)) return errorResponse("Perfil público inválido.", "VALIDATION_ERROR", 400);''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''    } else if (action === "delete_rule") {\n      const id = cleanText(body.id, 80);\n      await env.DB.prepare(`DELETE FROM booking_availability_rules WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();\n      auditTargetType = "availability_rule";\n      auditTargetId = id;\n      auditMetadata = { status: "deleted" };''',
    '''    } else if (action === "delete_rule") {\n      const id = cleanText(body.id, 80);\n      if (!id) return errorResponse("Regra inválida.", "VALIDATION_ERROR", 400);\n      const result = await env.DB.prepare(`DELETE FROM booking_availability_rules WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Regra não encontrada.", "NOT_FOUND", 404);\n      auditTargetType = "availability_rule";\n      auditTargetId = id;\n      auditMetadata = { status: "deleted" };''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''    } else if (action === "delete_block") {\n      const id = cleanText(body.id, 80);\n      await env.DB.prepare(`DELETE FROM booking_blocks WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();\n      auditTargetType = "availability_block";\n      auditTargetId = id;\n      auditMetadata = { status: "deleted" };''',
    '''    } else if (action === "delete_block") {\n      const id = cleanText(body.id, 80);\n      if (!id) return errorResponse("Bloqueio inválido.", "VALIDATION_ERROR", 400);\n      const result = await env.DB.prepare(`DELETE FROM booking_blocks WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Bloqueio não encontrado.", "NOT_FOUND", 404);\n      auditTargetType = "availability_block";\n      auditTargetId = id;\n      auditMetadata = { status: "deleted" };''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''      await env.DB.prepare(\n        `UPDATE appointments SET amount_cents = COALESCE(?, amount_cents), payment_status = ?, payment_method = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ?`,\n      ).bind(moneyCents(body.amountCents), status, cleanOptionalText(body.paymentMethod, 60), now, id, user.id).run();\n      auditTargetType = "appointment_payment";''',
    '''      const result = await env.DB.prepare(\n        `UPDATE appointments SET amount_cents = COALESCE(?, amount_cents), payment_status = ?, payment_method = ?, updated_at = ?\n          WHERE id = ? AND provider_user_id = ?`,\n      ).bind(moneyCents(body.amountCents), status, cleanOptionalText(body.paymentMethod, 60), now, id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);\n      auditTargetType = "appointment_payment";''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''      await env.DB.prepare(`UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();\n      auditTargetType = "waitlist";''',
    '''      const result = await env.DB.prepare(`UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Entrada da lista de espera não encontrada.", "NOT_FOUND", 404);\n      auditTargetType = "waitlist";''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''    } else if (action === "review_moderate") {\n      const id = cleanText(body.id, 80);\n      const approved = body.approved === true ? 1 : 0;\n      await env.DB.prepare(`UPDATE appointment_reviews SET approved = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(approved, now, id, user.id).run();\n      auditTargetType = "review";''',
    '''    } else if (action === "review_moderate") {\n      const id = cleanText(body.id, 80);\n      if (!id) return errorResponse("Avaliação inválida.", "VALIDATION_ERROR", 400);\n      const approved = body.approved === true ? 1 : 0;\n      const result = await env.DB.prepare(`UPDATE appointment_reviews SET approved = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(approved, now, id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Avaliação não encontrada.", "NOT_FOUND", 404);\n      auditTargetType = "review";''',
)
replace_once(
    "functions/api/operations/index.ts",
    '''      const id = cleanText(body.id, 80);\n      const status = cleanText(body.status, 30);\n      if (!["manual_sent", "failed"].includes(status)) return errorResponse("Status de notificação inválido.", "VALIDATION_ERROR", 400);\n      await env.DB.prepare(`UPDATE notification_outbox SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();\n      auditTargetType = "notification";''',
    '''      const id = cleanText(body.id, 80);\n      const status = cleanText(body.status, 30);\n      if (!id || !["manual_sent", "failed"].includes(status)) return errorResponse("Status de notificação inválido.", "VALIDATION_ERROR", 400);\n      const result = await env.DB.prepare(`UPDATE notification_outbox SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();\n      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Notificação não encontrada.", "NOT_FOUND", 404);\n      auditTargetType = "notification";''',
)

# 7) Regressão runtime do middleware multipart.
replace_once(
    "tests/unit/cloudflare-auth-middleware.test.ts",
    '''assert.equal(authorized.status, 200);\nassert.equal(authorized.headers.get("Access-Control-Allow-Origin"), null, "CORS não abre por padrão");''',
    '''assert.equal(authorized.status, 200);\nassert.equal(authorized.headers.get("Access-Control-Allow-Origin"), null, "CORS não abre por padrão");\n\nconst importMultipart = new FormData();\nimportMultipart.set("mode", "preview");\nimportMultipart.set("file", new File(["Paciente;Data\\nTeste;10/08/2018"], "export.csv", { type: "text/csv" }));\nconst importMultipartResponse = await onRequest({\n  request: new Request("https://neuroped.test/api/integrations/boaconsulta/import", {\n    method: "POST",\n    headers: { Authorization: `Bearer ${token}` },\n    body: importMultipart,\n  }),\n  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },\n  next,\n  data: {},\n} as never);\nassert.equal(\n  importMultipartResponse.status,\n  200,\n  "bridge BoaConsulta deve atravessar o middleware com multipart/form-data",\n);\n\nconst forbiddenMultipart = new FormData();\nforbiddenMultipart.set("file", new File(["x"], "x.txt", { type: "text/plain" }));\nconst genericMultipartResponse = await onRequest({\n  request: new Request("https://neuroped.test/api/patients", {\n    method: "POST",\n    headers: { Authorization: `Bearer ${token}` },\n    body: forbiddenMultipart,\n  }),\n  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },\n  next,\n  data: {},\n} as never);\nassert.equal(genericMultipartResponse.status, 415, "multipart continua proibido nas rotas clínicas JSON");''',
)

# 8) Regressões puras da agenda.
replace_once(
    "tests/unit/operations-contract.test.ts",
    '''  formatMoneyBRL,\n  isValidLocalDate,\n  isValidLocalDateTime,\n  minutesToClock,\n  occupiesSchedule,\n  overlapsLocal,\n} from "../../shared/operations";''',
    '''  formatMoneyBRL,\n  isValidLocalDate,\n  isValidLocalDateTime,\n  isValidTimeZone,\n  minutesToClock,\n  occupiesSchedule,\n  overlapsLocal,\n  selectFutureSlots,\n} from "../../shared/operations";\nimport { validSlug } from "../../functions/api/operations/_core";''',
)
replace_once(
    "tests/unit/operations-contract.test.ts",
    '''assert.equal(isValidLocalDate("2026-08-10"), true);\nassert.equal(isValidLocalDate("10/08/2026"), false);\nassert.equal(isValidLocalDateTime("2026-08-10T08:30"), true);\nassert.equal(isValidLocalDateTime("2026-08-10 08:30"), false);''',
    '''assert.equal(isValidLocalDate("2026-08-10"), true);\nassert.equal(isValidLocalDate("2024-02-29"), true, "ano bissexto válido");\nassert.equal(isValidLocalDate("2026-02-29"), false, "dia inexistente deve falhar");\nassert.equal(isValidLocalDate("2026-04-31"), false, "mês de 30 dias não aceita dia 31");\nassert.equal(isValidLocalDate("2026-13-01"), false, "mês impossível deve falhar");\nassert.equal(isValidLocalDate("10/08/2026"), false);\nassert.equal(isValidLocalDateTime("2026-08-10T08:30"), true);\nassert.equal(isValidLocalDateTime("2026-02-29T08:30"), false);\nassert.equal(isValidLocalDateTime("2026-08-10T24:00"), false);\nassert.equal(isValidLocalDateTime("2026-08-10T23:60"), false);\nassert.equal(isValidLocalDateTime("2026-08-10 08:30"), false);\nassert.equal(isValidTimeZone("America/Recife"), true);\nassert.equal(isValidTimeZone("Mars/Olympus"), false);\nassert.equal(validSlug("a"), true);\nassert.equal(validSlug("ab"), true, "slug de dois caracteres não pode ser rejeitado");\nassert.equal(validSlug("a-"), false);''',
)
replace_once(
    "tests/unit/operations-contract.test.ts",
    '''assert.match(formatMoneyBRL(50000), /500/);''',
    '''const manySlots = Array.from({ length: 140 }, (_, index) => {\n  const startsAtLocal = addMinutesLocal("2026-08-10T08:00", index * 5);\n  return { startsAtLocal, endsAtLocal: addMinutesLocal(startsAtLocal, 30) };\n});\nconst lateDaySlots = selectFutureSlots(manySlots, "2026-08-10T16:00", 20);\nassert.equal(lateDaySlots.length, 20, "cap deve ser aplicado depois de remover horários passados");\nassert.equal(lateDaySlots[0].startsAtLocal, "2026-08-10T16:05");\nassert.deepEqual(\n  selectFutureSlots([manySlots[100], manySlots[100]], "2026-08-10T16:00"),\n  [manySlots[100]],\n  "regras de disponibilidade sobrepostas não devem duplicar o mesmo horário público",\n);\nassert.match(formatMoneyBRL(50000), /500/);''',
)

# 9) Contratos estáticos: o comportamento corrigido vira catraca permanente.
replace_once(
    "tests/unit/operations-integration-static.test.mjs",
    '''const core = read("functions/api/operations/_core.ts");''',
    '''const core = read("functions/api/operations/_core.ts");\nconst sharedOperations = read("shared/operations.ts");''',
)
replace_once(
    "tests/unit/operations-integration-static.test.mjs",
    '''assert.match(professional, /localNow\\(profile\\.timezone\\)/, "métricas devem respeitar fuso da agenda");''',
    '''assert.match(professional, /localNow\\(profile\\.timezone\\)/, "métricas devem respeitar fuso da agenda");\nassert.match(professional, /isValidTimeZone\\(timezone\\)/, "perfil não pode persistir timezone IANA inválido");\nassert.ok(\n  (professional.match(/meta\\?\\.changes/g) ?? []).length >= 6,\n  "mutações por ID devem confirmar linha afetada antes de retornar sucesso/auditar",\n);''',
)
replace_once(
    "tests/unit/operations-integration-static.test.mjs",
    '''assert.match(publicBooking, /SCHEDULE_CONFLICT/);\nassert.doesNotMatch(publicBooking, /searchParams\\.get\\("token"\\)/, "capability token não pode trafegar em query string");''',
    '''assert.match(publicBooking, /SCHEDULE_CONFLICT/);\nassert.match(publicBooking, /selectFutureSlots/);\nassert.match(publicBooking, /isValidLocalDate\\(preferredDate\\)/);\nassert.doesNotMatch(core, /return slots\\.slice\\(0, 96\\)/, "cap de slots não pode ocorrer antes do filtro de horários passados");\nassert.match(sharedOperations, /date\\.getUTCFullYear\\(\\) === year/);\nassert.match(sharedOperations, /hour >= 0 && hour <= 23/);\nassert.doesNotMatch(publicBooking, /searchParams\\.get\\("token"\\)/, "capability token não pode trafegar em query string");''',
)

# 10) Documento de auditoria verificável.
(ROOT / "docs/AUDITORIA_BUGS_PROFUNDA_2026-08-10.md").write_text(
    '''# Auditoria profunda de bugs — NeuroPed — 10/08/2026\n\n## Escopo\n\nRevisão dirigida da `main` após a integração da Operational Suite, NeuroPed Conecta e bridge BoaConsulta. A auditoria priorizou bugs reproduzíveis de runtime, validação temporal, consistência de mutações e contratos de transporte.\n\n## Bugs comprovados e corrigidos\n\n1. **Upload BoaConsulta bloqueado pelo middleware** — `POST multipart/form-data` era rejeitado globalmente com 415 antes de chegar ao handler que usa `request.formData()`. Correção: exceção exata somente para `/api/integrations/boaconsulta/import`; demais mutações continuam JSON-only.\n2. **Datas e horas impossíveis aceitas na agenda** — validação por regex aceitava `2026-02-31`, `2026-13-01`, `24:00` e `23:60`. Correção: validação calendárica real e limites de relógio.\n3. **Horários futuros podiam desaparecer no fim do dia** — `listAvailableSlots()` cortava os primeiros 96 slots antes de filtrar horários passados. Correção: lista interna sem cap prematuro e seleção pública `futuro → deduplicação → cap`.\n4. **Slots públicos duplicados** — regras de disponibilidade sobrepostas podiam repetir o mesmo intervalo na resposta. Correção: deduplicação por intervalo no seletor público.\n5. **Falso sucesso em mutações operacionais** — exclusão de regra/bloqueio e atualização de pagamento/lista de espera/review/notificação podiam responder sucesso e gravar auditoria mesmo com ID inexistente. Correção: exigir exatamente uma linha afetada; 404 caso contrário.\n6. **Timezone inválido persistível** — perfil aceitava qualquer string de timezone. Correção: validação IANA via `Intl.DateTimeFormat`.\n7. **Slug de 2 caracteres rejeitado por regex** — um caso de borda incoerente (1 caractere e 3+ eram aceitos). Correção do quantificador.\n8. **Data preferencial inválida na lista de espera** — campo era truncado mas não validado. Agora usa a mesma validação calendárica da agenda.\n\n## Travas adicionadas\n\n- teste runtime do middleware para multipart BoaConsulta + bloqueio multipart nas demais rotas;\n- regressões de datas bissextas/impossíveis, horários inválidos, timezone e slug;\n- regressão de cap após filtro e deduplicação de slots;\n- contrato estático exigindo confirmação de `meta.changes` nas mutações por ID.\n\n## Fora de escopo deliberado\n\n- não alterada lógica clínica de ranking/escalas;\n- não ativada persistência LIVE de dados clínicos;\n- não alteradas chaves de criptografia existentes;\n- não simulados provedores externos de WhatsApp, pagamentos ou vídeo.\n''',
    "utf-8",
)

print("Correções profundas aplicadas com sucesso")
