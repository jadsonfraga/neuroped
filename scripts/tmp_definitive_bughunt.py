from __future__ import annotations
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.ts', '.tsx', '.js', '.mjs', '.cjs'}
IGNORE = {'node_modules', 'dist', 'coverage', '.git', 'attached_assets'}
files = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in EXTS and not any(part in IGNORE for part in p.parts)]

def read(p: Path) -> str:
    try:
        return p.read_text('utf-8')
    except Exception:
        return ''

def emit(title: str, rows: list[str]) -> None:
    print(f'\n## {title} ({len(rows)})')
    for row in rows[:200]:
        print(row)

# 1) D1 UPDATE/DELETE que parecem depender de identidade mas não checam affected rows.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('functions/api/'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if not re.search(r'\b(?:UPDATE|DELETE FROM)\b', line):
            continue
        window = '\n'.join(lines[max(0, i-4):min(len(lines), i+18)])
        if '.run()' not in window:
            continue
        # ignora manutenção deliberadamente idempotente / limpeza de sessão e locks já auditados
        if any(token in window for token in [
            'failed_login_attempts', 'last_login_at', 'locked_until',
            'auth_refresh_sessions', 'appointment_slot_locks',
            'CREATE ', 'DROP ', 'PRAGMA ',
        ]):
            continue
        if not re.search(r'(meta\?\.changes|meta\.changes|changes\s*\?\?)', window):
            rows.append(f'{rel}:{i+1} :: {line.strip()}')
emit('D1 identity mutations without affected-row check', rows)

# 2) Express/SQLite DELETE/UPDATE em rotas sem checagem de changes.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('server/routes'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if not re.search(r'\b(?:UPDATE|DELETE FROM)\b', line):
            continue
        window = '\n'.join(lines[max(0, i-4):min(len(lines), i+16)])
        if '.run(' not in window:
            continue
        if any(token in window for token in ['auth_refresh_sessions', 'DELETE FROM sessions']):
            continue
        if not re.search(r'\.changes\b', window):
            rows.append(f'{rel}:{i+1} :: {line.strip()}')
emit('Express mutations without affected-row check', rows)

# 3) mutações fetch cruas no cliente sem confirmação HTTP.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if 'fetch(' not in line:
            continue
        window = '\n'.join(lines[i:min(len(lines), i+35)])
        if not re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', window):
            continue
        if '/api/auth/logout' in window:
            continue
        if not re.search(r'\b(?:response|res)\.ok\b|\b(?:response|res)\.status\b|apiRequest\(', window):
            rows.append(f'{rel}:{i+1} :: {line.strip()}')
emit('Client raw mutations without HTTP success check', rows)

# 4) browser storage com payload clínico/paciente explícito sem wrapper seguro.
rows = []
clinical_tokens = ('patient', 'pacient', 'diagnos', 'medic', 'clinical', 'clinico', 'consulta', 'prontuario', 'scale', 'escala', 'conecta', 'laudo')
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    for i, line in enumerate(read(p).splitlines(), 1):
        low = line.lower()
        if ('localstorage.setitem' in low or 'sessionstorage.setitem' in low) and any(k in low for k in clinical_tokens):
            if not any(safe in rel for safe in ['secureStorage', 'useSecureScaleDraft']):
                rows.append(f'{rel}:{i} :: {line.strip()}')
emit('Clinical-looking direct browser storage writes', rows)

# 5) parsing de portas/config numéricas sem validação explícita.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('server/'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if 'parseInt(' in line and ('process.env' in line or any('process.env' in x for x in lines[max(0,i-4):i+1])):
            window = '\n'.join(lines[max(0,i-6):min(len(lines),i+10)])
            if not re.search(r'Number\.is(?:SafeInteger|Integer|Finite)|isNaN|>\s*0|<=\s*65535', window):
                rows.append(f'{rel}:{i+1} :: {line.strip()}')
emit('Unvalidated numeric environment parsing', rows)

# 6) date-only -> Date timezone drift em UI / shared runtime.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith(('client/src/', 'shared/')):
        continue
    for i, line in enumerate(read(p).splitlines(), 1):
        if re.search(r'new Date\([^\n]*(?:birth|dob|dataNascimento|birthDate|dateOnly|date_of_birth)', line, re.I):
            rows.append(f'{rel}:{i} :: {line.strip()}')
emit('Date-only timezone drift candidates', rows)

# 7) novas abas sem isolamento de opener.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if 'window.open(' in line:
            window = '\n'.join(lines[i:min(len(lines), i+14)])
            if '.opener = null' not in window and 'noopener' not in window and 'noreferrer' not in window:
                rows.append(f'{rel}:{i+1} :: {line.strip()}')
        if 'target="_blank"' in line:
            window = ' '.join(lines[max(0,i-2):min(len(lines), i+4)])
            if 'rel=' not in window:
                rows.append(f'{rel}:{i+1} :: target=_blank sem rel')
emit('New-window opener isolation gaps', rows)

# 8) JSON.parse de storage sem proteção local aparente.
rows = []
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith('client/src/'):
        continue
    lines = read(p).splitlines()
    for i, line in enumerate(lines):
        if 'JSON.parse(' in line and ('localStorage' in line or 'sessionStorage' in line):
            window = '\n'.join(lines[max(0,i-6):min(len(lines), i+8)])
            if 'try {' not in window and 'safeJson' not in window and 'parseStored' not in window:
                rows.append(f'{rel}:{i+1} :: {line.strip()}')
emit('Unsafe JSON.parse from browser storage', rows)

# 9) rate limiter KV provisionado mas não consumido é falha operacional concreta.
middleware = read(ROOT / 'functions/api/_middleware.ts')
rate_kv_used = bool(re.search(r'RATE_LIMIT_KV\?\.(?:get|put)|env\.RATE_LIMIT_KV\.(?:get|put)', middleware))
rows = [] if rate_kv_used else ['functions/api/_middleware.ts :: RATE_LIMIT_KV está declarado/provisionado, mas o limitador usa apenas Map local por isolate']
emit('Distributed rate-limit persistence', rows)

# 10) service worker: GET de dados fora de /api com nomes clínicos deve continuar network-only.
sw = read(ROOT / 'client/public/sw.js')
rows = []
for marker in ['/patients', '/consultations', '/documents']:
    if marker not in sw:
        rows.append(f'client/public/sw.js :: marker network-only ausente: {marker}')
emit('Service-worker clinical cache guard', rows)

print(f'\nScanned {len(files)} source/test files.')
