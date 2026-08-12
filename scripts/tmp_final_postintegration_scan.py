from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}
SKIP_PARTS = {'node_modules', 'dist', '.git', 'coverage', '.wrangler'}

files: list[Path] = []
for path in ROOT.rglob('*'):
    if not path.is_file() or path.suffix not in EXTS:
        continue
    if any(part in SKIP_PARTS for part in path.parts):
        continue
    files.append(path)


def text(path: Path) -> str:
    try:
        return path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        return path.read_text(encoding='utf-8', errors='ignore')


def report(title: str, items: list[str]) -> None:
    print(f'\n## {title} ({len(items)})')
    for item in items[:120]:
        print(item)
    if len(items) > 120:
        print(f'... +{len(items) - 120} itens')


def line_hits(pattern: re.Pattern[str], *, include=None, exclude=None) -> list[str]:
    out: list[str] = []
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        if include and not include(rel):
            continue
        if exclude and exclude(rel):
            continue
        for n, line in enumerate(text(path).splitlines(), 1):
            if pattern.search(line):
                out.append(f'{rel}:{n} :: {line.strip()[:240]}')
    return out

# 1) Configuração numérica: parse cru de env costuma propagar NaN/0 fora de faixa.
env_numeric = line_hits(
    re.compile(r'(?:parseInt|parseFloat|Number)\s*\(\s*process\.env\.'),
    exclude=lambda r: r.endswith('runtimeConfig.ts') or '/tests/' in r or r.startswith('tests/'),
)
report('Numeric env parsing outside runtimeConfig', env_numeric)

# 2) Dados clínicos em Web Storage síncrono.
sensitive_storage: list[str] = []
keywords = re.compile(r'patient|pacient|clinical|clinico|consulta|diagnos|medica|seizure|epilep|headache|diario|report|laudo|receita|scale|resultado', re.I)
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    src = text(path)
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if re.search(r'(?:localStorage|sessionStorage)\.setItem\s*\(', line):
            window = '\n'.join(lines[max(0, i-2): min(len(lines), i+5)])
            if keywords.search(window):
                sensitive_storage.append(f'{rel}:{i+1} :: {line.strip()[:240]}')
report('Clinical-looking direct Web Storage writes', sensitive_storage)

# 3) JSON.parse diretamente sobre storage sem wrapper de validação.
unsafe_storage_json = line_hits(re.compile(r'JSON\.parse\s*\([^\n]*(?:localStorage|sessionStorage)'), include=lambda r: r.startswith('client/src/'))
report('Direct JSON.parse from Web Storage', unsafe_storage_json)

# 4) window.open sem isolamento explícito.
window_open: list[str] = []
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    lines = text(path).splitlines()
    for i, line in enumerate(lines):
        if 'window.open(' not in line:
            continue
        window = ' '.join(lines[i:min(len(lines), i+4)])
        if 'noopener' not in window and "'_self'" not in window and '"_self"' not in window:
            window_open.append(f'{rel}:{i+1} :: {line.strip()[:240]}')
report('window.open without opener isolation', window_open)

# 5) DOM injection primitives.
dom_injection = line_hits(re.compile(r'dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML\s*\('), exclude=lambda r: '/tests/' in r or r.startswith('tests/'))
report('DOM HTML injection primitives requiring sanitizer review', dom_injection)

# 6) Eval/dynamic Function.
dynamic_code = line_hits(re.compile(r'\beval\s*\(|new\s+Function\s*\('), exclude=lambda r: '/tests/' in r or r.startswith('tests/'))
report('Dynamic code execution primitives', dynamic_code)

# 7) Login outward account-state oracle signals.
auth_oracles: list[str] = []
for rel in ['functions/api/auth/login.ts', 'server/auth/routes.ts']:
    path = ROOT / rel
    if not path.exists():
        continue
    for n, line in enumerate(text(path).splitlines(), 1):
        if re.search(r'ACCOUNT_DISABLED|ACCOUNT_LOCKED|AUTH_LOCKED|423|Conta desativada|temporariamente bloqueada', line, re.I):
            auth_oracles.append(f'{rel}:{n} :: {line.strip()[:240]}')
report('Potential outward account-state oracle markers in login handlers', auth_oracles)

# 8) Admin/audit fixture fallback.
demo_admin = line_hits(re.compile(r'DEMO_LOGS|audit.*mode\s*:\s*["\']demo|Log de auditoria simulado', re.I), include=lambda r: 'audit' in r.lower() or 'admin' in r.lower())
report('Admin/audit demo fallbacks', demo_admin)

# 9) Service worker must never intercept/cache /api.
sw_path = ROOT / 'client/public/sw.js'
sw_issues: list[str] = []
if sw_path.exists():
    sw = text(sw_path)
    if 'url.pathname.startsWith("/api/")' not in sw and "url.pathname.startsWith('/api/')" not in sw:
        sw_issues.append('client/public/sw.js :: missing /api/ network-only guard')
    if re.search(r'cache(?:First|\.put)[\s\S]{0,250}/api/', sw, re.I):
        sw_issues.append('client/public/sw.js :: possible API cache path')
report('Service-worker clinical cache guard', sw_issues)

# 10) Obvious wildcard CORS in server/runtime code.
wildcard_cors = line_hits(re.compile(r'corsOrigins\.includes\(["\']\*["\']\)|Access-Control-Allow-Origin["\']?\s*[:,]\s*["\']\*["\']'), exclude=lambda r: '/tests/' in r or r.startswith('tests/'))
report('Wildcard CORS paths requiring production review', wildcard_cors)

# 11) Weak/default secrets.
default_secrets = line_hits(re.compile(r'(JWT|SECRET|PASSWORD|TOKEN)[A-Z0-9_]*\s*(?:=|\|\|)\s*["\'][^"\']{4,}["\']', re.I), exclude=lambda r: '/tests/' in r or r.startswith('tests/') or r.endswith('.config.js'))
report('Hardcoded/default secret-looking assignments', default_secrets)

# 12) Date-only constructor drift: direct new Date(dateOnlyVariable) is risky.
date_only: list[str] = []
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    for n, line in enumerate(text(path).splitlines(), 1):
        if 'new Date(' in line and re.search(r'new Date\((?:birthDate|dateOfBirth|dataNascimento|dob)\)', line):
            date_only.append(f'{rel}:{n} :: {line.strip()[:240]}')
report('Direct date-only constructors with timezone drift risk', date_only)

# 13) Mutating fetch calls whose nearby block has no response.ok/status handling.
fetch_mutations: list[str] = []
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    lines = text(path).splitlines()
    for i, line in enumerate(lines):
        if 'fetch(' not in line:
            continue
        block = '\n'.join(lines[i:min(len(lines), i+22)])
        if not re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', block):
            continue
        if not re.search(r'\.ok\b|status\b|apiRequest\b|throwIfResNotOk', block):
            fetch_mutations.append(f'{rel}:{i+1} :: {line.strip()[:240]}')
report('Client mutation fetches without nearby HTTP success check', fetch_mutations)

# 14) SQL identity mutations with no affected-row signal in nearby block (heuristic).
mutation_no_effect: list[str] = []
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not (rel.startswith('functions/api/') or rel.startswith('server/')):
        continue
    lines = text(path).splitlines()
    for i, line in enumerate(lines):
        if not re.search(r'\b(?:UPDATE|DELETE FROM)\b', line, re.I):
            continue
        block = '\n'.join(lines[i:min(len(lines), i+18)])
        if '.run(' not in block and '.batch(' not in block:
            continue
        if re.search(r'meta\?\.changes|meta\.changes|\.changes\b|changes\(\)|returning\(', block, re.I):
            continue
        # Schema/migration statements are not request-level mutations.
        if 'CREATE TRIGGER' in block or 'CREATE TABLE' in block or rel.startswith('server/storage'):
            continue
        mutation_no_effect.append(f'{rel}:{i+1} :: {line.strip()[:240]}')
report('Request-path UPDATE/DELETE without nearby affected-row evidence', mutation_no_effect)

# 15) Audit writes performed separately after a request-path mutation (heuristic).
nonatomic_audit: list[str] = []
for path in files:
    rel = path.relative_to(ROOT).as_posix()
    if not (rel.startswith('functions/api/') or rel.startswith('server/routes/')):
        continue
    src = text(path)
    if ('UPDATE ' in src or 'DELETE FROM ' in src or 'INSERT INTO ' in src) and ('logAudit(' in src or 'prepareSaasAudit(' in src):
        if 'batch([' not in src and 'transaction(' not in src:
            nonatomic_audit.append(rel)
report('Mutation+audit modules without any visible transaction/batch primitive', sorted(set(nonatomic_audit)))

print(f'\nScanned {len(files)} source/test files.')
