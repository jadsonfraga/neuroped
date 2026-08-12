from pathlib import Path

root = Path(__file__).resolve().parents[1]
security = root / "server/middleware/security.ts"
s = security.read_text(encoding="utf-8")

old = '''  if (corsOrigins.length > 0) {\n    app.use(\n      cors({\n        origin: (origin, cb) => {\n          if (!origin) return cb(null, true);\n          if (corsOrigins.includes(origin) || corsOrigins.includes("*")) {\n            return cb(null, true);\n          }\n          return cb(new Error("Origem nao autorizada pelo CORS"));\n        },\n'''
new = '''  if (corsOrigins.length > 0) {\n    app.use(\n      cors({\n        origin: (origin, cb) => {\n          if (isCorsOriginAllowed(origin, corsOrigins)) return cb(null, true);\n          return cb(new Error("Origem nao autorizada pelo CORS"));\n        },\n'''

helper = '''\nexport function isCorsOriginAllowed(\n  origin: string | undefined,\n  corsOrigins: readonly string[],\n  isProduction = process.env.NODE_ENV === "production",\n): boolean {\n  if (!origin) return true;\n  if (corsOrigins.includes(origin)) return true;\n\n  // Wildcard é útil apenas para desenvolvimento local. Em produção, aceitar\n  // `*` junto de `credentials: true` converte um erro de configuração em CORS\n  // aberto para qualquer origem. Falha fechada: somente origens nominais.\n  return !isProduction && corsOrigins.includes("*");\n}\n\n'''

if "export function isCorsOriginAllowed(" not in s:
    anchor = "export function applySecurity(app: Express): void {\n"
    if anchor not in s:
        raise SystemExit("security anchor not found")
    s = s.replace(anchor, helper + anchor, 1)

if old in s:
    s = s.replace(old, new, 1)
elif "isCorsOriginAllowed(origin, corsOrigins)" not in s:
    raise SystemExit("CORS callback pattern not found")
security.write_text(s, encoding="utf-8")

quick = root / "tests/unit/quick-wins-static.test.mjs"
q = quick.read_text(encoding="utf-8")
marker = "// CORS de produção deve falhar fechado mesmo se a env receber wildcard."
if marker not in q:
    addition = '''\n\n// CORS de produção deve falhar fechado mesmo se a env receber wildcard.\nconst expressSecurity = read("server/middleware/security.ts");\nassert.match(expressSecurity, /export function isCorsOriginAllowed/);\nassert.match(expressSecurity, /return !isProduction && corsOrigins\\.includes\\("\\*"\\)/);\nassert.doesNotMatch(\n  expressSecurity,\n  /corsOrigins\\.includes\\(origin\\) \\|\\| corsOrigins\\.includes\\("\\*"\\)/,\n  "produção não pode aceitar wildcard CORS com credenciais",\n);\n'''
    q += addition
    quick.write_text(q, encoding="utf-8")
