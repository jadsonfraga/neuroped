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


# 9) PATCH/DELETE de paciente ainda simulavam sucesso sem D1, contrariando a
# regra fail-closed já aplicada aos POSTs clínicos.
replace_once(
    "functions/api/patients/[id].ts",
    '''  const user = env.DB ? getContextUser(context) : null;\n  if (env.DB && !user) {''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhum paciente foi atualizado.",\n      "DB_REQUIRED",\n      503,\n    );\n  }\n\n  const user = getContextUser(context);\n  if (!user) {''',
)
replace_once(
    "functions/api/patients/[id].ts",
    '''  if (env.DB && user) {\n    try {''',
    '''  if (user) {\n    try {''',
)
replace_once(
    "functions/api/patients/[id].ts",
    '''  const now = new Date().toISOString();\n  if (!env.DB) {\n    const partial = toPatientApi({\n      id,\n      ...normalized.values,\n      is_demo: 1,\n      updated_at: now,\n    });\n    return jsonResponse({ ...partial, updated: true, mode: "demo" });\n  }\n\n  try {''',
    '''  const now = new Date().toISOString();\n\n  try {''',
)
replace_once(
    "functions/api/patients/[id].ts",
    '''  if (!env.DB) {\n    return jsonResponse({ id, deleted: false, mode: "demo" });\n  }''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhum paciente foi removido.",\n      "DB_REQUIRED",\n      503,\n    );\n  }''',
)

# 10) DELETE de resultado respondia HTTP 200/deleted:false sem D1. A UI usa
# res.ok como sucesso e portanto exibia “Avaliação removida” sem remover nada.
replace_once(
    "functions/api/results/[id].ts",
    '''  if (!env.DB) return json({ deleted: false, mode: "demo" }, 200);''',
    '''  if (!env.DB) {\n    return json(\n      { error: "Persistência indisponível. Nenhum resultado foi removido.", code: "DB_REQUIRED" },\n      503,\n    );\n  }''',
)

# 11) GET de slots ainda validava a data só por regex; uma data impossível era
# apresentada como “sem horários” em vez de ser rejeitada como entrada inválida.
replace_once(
    "functions/api/public-booking.ts",
    '''      if (!service || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {''',
    '''      if (!service || !isValidLocalDate(date)) {''',
)

# 12) Number("") e Number(null) são 0. Sem guarda, campos inteiros cujo mínimo
# é zero (ex.: weekday/startMinute) podiam converter ausência em domingo/meia-noite.
replace_once(
    "functions/api/operations/index.ts",
    '''function integerBetween(value: unknown, min: number, max: number): number | null {\n  const parsed = Number(value);''',
    '''function integerBetween(value: unknown, min: number, max: number): number | null {\n  if (value === null || value === undefined || value === "") return null;\n  const parsed = Number(value);''',
)

# Regressão runtime de todas as escritas clínicas sem banco, incluindo PATCH e DELETE.
replace_once(
    "tests/unit/no-fake-clinical-write.test.ts",
    '''import { onRequestPost as createUiResult } from "../../functions/api/results";''',
    '''import { onRequestPost as createUiResult } from "../../functions/api/results";\nimport {\n  onRequestPatch as updatePatient,\n  onRequestDelete as deletePatient,\n} from "../../functions/api/patients/[id]";\nimport { onRequestDelete as deleteScaleResult } from "../../functions/api/results/[id]";''',
)
replace_once(
    "tests/unit/no-fake-clinical-write.test.ts",
    '''console.log("✓ Escritas clínicas sem D1 falham fechado; nenhum 201 simulado é permitido");''',
    '''async function expectMutationDbRequired(\n  name: string,\n  handler: Handler,\n  method: "PATCH" | "DELETE",\n  body?: Record<string, unknown>,\n): Promise<void> {\n  const request = new Request(`https://neuroped.invalid/api/${name}/demo-001`, {\n    method,\n    headers: body ? { "Content-Type": "application/json" } : undefined,\n    body: body ? JSON.stringify(body) : undefined,\n  });\n  const response = await handler({\n    env: {},\n    request,\n    params: { id: "demo-001" },\n    data: {},\n  });\n  const payload = await response.json() as { code?: string; error?: string; deleted?: boolean; updated?: boolean };\n  assert.equal(response.status, 503, `${name}: ${method} sem DB deve falhar com 503`);\n  assert.equal(payload.code, "DB_REQUIRED", `${name}: ${method} deve sinalizar DB_REQUIRED`);\n  assert.notEqual(payload.deleted, true, `${name}: não pode declarar remoção sem persistência`);\n  assert.notEqual(payload.updated, true, `${name}: não pode declarar atualização sem persistência`);\n}\n\nawait expectMutationDbRequired("patients", updatePatient as Handler, "PATCH", { name: "Paciente Editado" });\nawait expectMutationDbRequired("patients", deletePatient as Handler, "DELETE");\nawait expectMutationDbRequired("results", deleteScaleResult as Handler, "DELETE");\n\nconsole.log("✓ Escritas clínicas sem D1 falham fechado em POST, PATCH e DELETE");''',
)

# Reforça os contratos estáticos da Operational Suite.
replace_once(
    "tests/unit/operations-integration-static.test.mjs",
    '''assert.match(publicBooking, /isValidLocalDate\\(preferredDate\\)/);''',
    '''assert.match(publicBooking, /isValidLocalDate\\(preferredDate\\)/);\nassert.match(publicBooking, /!isValidLocalDate\\(date\\)/, "consulta de slots deve rejeitar data calendárica impossível");\nassert.match(\n  professional,\n  /value === null \\|\\| value === undefined \\|\\| value === ""/,\n  "campos inteiros não podem converter ausência em zero silenciosamente",\n);''',
)

# Atualiza a documentação da auditoria com a segunda passada.
doc = ROOT / "docs/AUDITORIA_BUGS_PROFUNDA_2026-08-10.md"
text = doc.read_text("utf-8")
anchor = '''8. **Data preferencial inválida na lista de espera** — campo era truncado mas não validado. Agora usa a mesma validação calendárica da agenda.\n'''
addition = '''8. **Data preferencial inválida na lista de espera** — campo era truncado mas não validado. Agora usa a mesma validação calendárica da agenda.\n9. **PATCH de paciente simulava atualização sem D1** — podia devolver `updated: true` sem persistir. Agora falha com `503 DB_REQUIRED`.\n10. **DELETE clínico podia parecer sucesso sem D1** — paciente retornava HTTP 200/deleted:false e resultado de escala também; a UI interpreta 2xx como sucesso. Agora ambos falham fechado com `503 DB_REQUIRED`.\n11. **Data impossível em consulta de slots parecia agenda vazia** — a rota pública usava regex; agora rejeita a data calendárica com 400.\n12. **Campos inteiros vazios viravam zero** — `Number("")`/`Number(null)` podiam converter ausência em domingo ou 00:00. Agora ausência é inválida.\n'''
if anchor not in text:
    raise SystemExit("âncora da auditoria não encontrada")
doc.write_text(text.replace(anchor, addition, 1), "utf-8")

print("Segunda passada fail-closed aplicada")
