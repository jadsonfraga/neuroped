from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.ts', '.tsx', '.js', '.mjs', '.cjs'}
IGNORE_PARTS = {'node_modules', 'dist', 'coverage', '.git', 'docs', 'attached_assets'}

files = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in EXTS and not any(part in IGNORE_PARTS for part in p.parts)]


def text(path: Path) -> str:
    try:
        return path.read_text('utf-8')
    except Exception:
        return ''


def emit(title: str, rows: list[str]) -> None:
    print(f'\n## {title} ({len(rows)})')
    for row in rows[:250]:
        print(row)

# 1) API mutações com fallback 2xx/demo sem DB.
rows = []
for p in files:
    if 'functions/api' not in p.as_posix():
        continue
    s = text(p)
    if re.search(r'onRequest(Post|Patch|Put|Delete)', s) and 'if (!env.DB)' in s:
        for m in re.finditer(r'if \(!env\.DB\)[\s\S]{0,500}?return\s+(?:jsonResponse|json|new Response)\(([\s\S]{0,240}?)\);', s):
            frag = ' '.join(m.group(0).split())
            if not re.search(r'\b(4\d\d|5\d\d)\b', frag) and 'DB_REQUIRED' not in frag:
                rows.append(f'{p.relative_to(ROOT)} :: {frag[:300]}')
emit('Mutation DB fallbacks without explicit 4xx/5xx', rows)

# 2) Query integer parsing that can become NaN.
rows = []
for p in files:
    s = text(p)
    for i, line in enumerate(s.splitlines(), 1):
        if 'parseInt(' in line and ('searchParams' in line or 'query' in line) and not any(tok in line for tok in ('Number.isFinite', 'Number.isNaN')):
            rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('Potential NaN query parsing', rows)

# 3) UPDATE/DELETE via D1 without checking changes nearby.
rows = []
for p in files:
    if 'functions/api' not in p.as_posix():
        continue
    lines = text(p).splitlines()
    for i, line in enumerate(lines):
        if re.search(r'\b(UPDATE|DELETE FROM)\b', line) and ('prepare(' in ''.join(lines[max(0,i-3):i+2]) or '`UPDATE' in line or '`DELETE' in line):
            window = '\n'.join(lines[i:min(len(lines), i+12)])
            if '.run()' in window and not re.search(r'(meta\??\.changes|meta\.changes|changes\))', window):
                rows.append(f'{p.relative_to(ROOT)}:{i+1} :: {line.strip()}')
emit('D1 mutations without nearby affected-row check', rows)

# 4) fetch mutation without res.ok check in same function-ish window.
rows = []
for p in files:
    if 'client/src' not in p.as_posix():
        continue
    lines = text(p).splitlines()
    for i, line in enumerate(lines):
        if re.search(r'await\s+fetch\(', line):
            window = '\n'.join(lines[i:min(len(lines), i+18)])
            if re.search(r'method:\s*["\'](?:POST|PATCH|PUT|DELETE)["\']', window) and not re.search(r'\.ok\b|response\.status|res\.status', window):
                rows.append(f'{p.relative_to(ROOT)}:{i+1} :: {line.strip()}')
emit('Client mutations potentially not checking HTTP success', rows)

# 5) dangerouslySetInnerHTML sites.
rows = []
for p in files:
    s = text(p)
    if 'dangerouslySetInnerHTML' in s:
        for i, line in enumerate(s.splitlines(), 1):
            if 'dangerouslySetInnerHTML' in line:
                rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('dangerouslySetInnerHTML surfaces', rows)

# 6) window.open without noopener/noreferrer nearby.
rows = []
for p in files:
    lines = text(p).splitlines()
    for i, line in enumerate(lines):
        if 'window.open(' in line:
            window = '\n'.join(lines[max(0,i-2):min(len(lines), i+5)])
            if 'noopener' not in window and 'noreferrer' not in window:
                rows.append(f'{p.relative_to(ROOT)}:{i+1} :: {line.strip()}')
emit('window.open without explicit opener isolation', rows)

# 7) target blank without rel nearby.
rows = []
for p in files:
    if p.suffix != '.tsx':
        continue
    lines = text(p).splitlines()
    for i, line in enumerate(lines):
        if 'target="_blank"' in line:
            window = ' '.join(lines[max(0,i-2):min(len(lines), i+3)])
            if 'rel=' not in window:
                rows.append(f'{p.relative_to(ROOT)}:{i+1} :: {line.strip()}')
emit('target=_blank without rel', rows)

# 8) local/session storage candidates containing clinical/patient context.
rows = []
keywords = ('patient', 'pacient', 'diagnos', 'medic', 'clinical', 'clinico', 'consulta', 'prontuario', 'scale', 'escala', 'conecta')
for p in files:
    if 'client/src' not in p.as_posix():
        continue
    for i, line in enumerate(text(p).splitlines(), 1):
        low = line.lower()
        if ('localstorage' in low or 'sessionstorage' in low) and any(k in low for k in keywords):
            rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('Clinical-looking browser storage', rows)

# 9) empty catch blocks / swallowed failures.
rows = []
for p in files:
    s = text(p)
    for m in re.finditer(r'catch\s*(?:\([^)]*\))?\s*\{\s*\}', s):
        line = s[:m.start()].count('\n') + 1
        rows.append(f'{p.relative_to(ROOT)}:{line} :: empty catch')
emit('Empty catch blocks', rows)

# 10) date parsing of date-only strings in client (UTC drift candidate).
rows = []
for p in files:
    if 'client/src' not in p.as_posix():
        continue
    for i, line in enumerate(text(p).splitlines(), 1):
        if re.search(r'new Date\([^)]*(birth|date|data|dob)', line, re.I):
            rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('Date-only timezone drift candidates', rows)

# 11) TODO-like markers with individual terms (avoid code-search limitations).
rows = []
for p in files:
    for i, line in enumerate(text(p).splitlines(), 1):
        if re.search(r'\b(TODO|FIXME|HACK|XXX|NOT IMPLEMENTED|TEMPORARY)\b', line, re.I):
            rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('Debt markers', rows)

# 12) potentially unsafe Math max/min(parseInt) pattern anywhere.
rows = []
for p in files:
    for i, line in enumerate(text(p).splitlines(), 1):
        if re.search(r'Math\.(?:max|min)\([^\n]*parseInt\(', line):
            rows.append(f'{p.relative_to(ROOT)}:{i} :: {line.strip()}')
emit('Math max/min around parseInt (NaN propagation)', rows)

print(f'\nScanned {len(files)} source/test files.')
