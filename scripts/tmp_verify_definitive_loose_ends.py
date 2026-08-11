from pathlib import Path
import re

ROOT = Path('.')
problems = []
notes = []


def text(path):
    return (ROOT / path).read_text(encoding='utf-8')


def fail(label, detail):
    problems.append(f'{label}: {detail}')

# Central fail-closed invariant.
middleware = text('functions/api/_middleware.ts')
if 'if (!env.DB) return { failure: null, user: null };' in middleware:
    fail('auth fail-open', 'private middleware still bypasses auth when D1 is absent')
if '"DB_REQUIRED"' not in middleware:
    fail('auth fail-closed', 'DB_REQUIRED guard missing from private middleware')
if 'RATE_LIMIT_KV.get(sharedKey)' not in middleware or 'RATE_LIMIT_KV.put(sharedKey' not in middleware:
    fail('rate limit', 'provisioned KV is not participating in shared rate limiting')
if 'await checkRateLimit(request, env)' not in middleware:
    fail('rate limit', 'shared limiter is not awaited by request pipeline')

# Login enumeration: public outcome must be generic across account states.
cf_login = text('functions/api/auth/login.ts')
for marker in ['ACCOUNT_LOCKED', 'ACCOUNT_DISABLED']:
    if marker in cf_login:
        fail('Cloudflare auth enumeration', f'public marker {marker} still present')
if 'DUMMY_PASSWORD_HASH' not in cf_login:
    fail('Cloudflare auth timing', 'dummy PBKDF2 verification missing')
express_login = text('server/auth/routes.ts')
if 'AUTH_LOCKED' in express_login:
    fail('Express auth enumeration', 'AUTH_LOCKED still exposes account state')
if 'DUMMY_PASSWORD_HASH' not in express_login:
    fail('Express auth timing', 'dummy bcrypt verification missing')

# Clinical Core correction must be compare-and-set, not read-then-blind-update.
express_core = text('server/routes/clinical-core.ts')
if "status = 'corrected' WHERE id = ? AND patient_id = ? AND status = 'active'" not in express_core:
    fail('Clinical Core Express CAS', 'conditional active->corrected update missing')
if 'correction.changes !== 1' not in express_core or 'STALE_SUPERSESSION' not in express_core:
    fail('Clinical Core Express stale', 'affected-row stale detection missing')
d1_core = text('functions/api/clinical-core/index.ts')
d1_schema = text('functions/api/clinical-core/_schema.ts')
migration = text('db/migrations/0006_clinical_core.sql')
if "AND status = 'active'" not in d1_core:
    fail('Clinical Core D1 CAS', 'conditional source update missing')
for source_name, source in [('D1 schema', d1_schema), ('D1 migration', migration)]:
    if 'trg_clinical_events_demo_active_supersession' not in source or "RAISE(ABORT, 'STALE_SUPERSESSION')" not in source:
        fail('Clinical Core D1 trigger', f'{source_name} lacks stale-supersession trigger')

# Numeric environment parsing: direct parseInt on process.env is forbidden.
for path in ROOT.rglob('*.ts'):
    if any(part in {'node_modules', 'dist'} for part in path.parts):
        continue
    src = path.read_text(encoding='utf-8', errors='ignore')
    for i, line in enumerate(src.splitlines(), 1):
        if re.search(r'parseInt\(process\.env\.', line):
            fail('numeric env', f'{path}:{i}: {line.strip()}')

# Common persistence truth bugs: identity mutations should inspect affected rows.
for path in list((ROOT / 'functions/api').rglob('*.ts')) + list((ROOT / 'server').rglob('*.ts')):
    src = path.read_text(encoding='utf-8', errors='ignore')
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if re.search(r'\b(UPDATE|DELETE)\b', line) and ('prepare(' in line or '`UPDATE' in line or '`DELETE' in line):
            window = '\n'.join(lines[max(0, i-2):min(len(lines), i+12)])
            # Only flag obvious blind identity mutations. SQL migrations/docs are excluded by path set.
            if '.run(' in window and not re.search(r'(changes|meta\?\.changes|meta\.changes|rowCount|returning)', window):
                # audit-only and bulk cleanup statements can intentionally ignore affected rows.
                if not any(token in window for token in ['audit_logs', 'auth_refresh_sessions', 'refreshTokens', 'revokedAt', 'failedLoginAttempts']):
                    notes.append(f'candidate blind mutation {path}:{i+1}')

# Browser-storage safety.
for path in (ROOT / 'client/src').rglob('*'):
    if path.suffix not in {'.ts', '.tsx'}:
        continue
    src = path.read_text(encoding='utf-8', errors='ignore')
    if re.search(r'JSON\.parse\([^\n]*(localStorage|sessionStorage)\.getItem', src):
        fail('browser storage parse', str(path))
    for i, line in enumerate(src.splitlines(), 1):
        if 'window.open(' in line and not any(tok in line for tok in ['noopener', 'noreferrer']):
            # Multi-line helpers are reviewed by existing static gates; keep as note only.
            notes.append(f'window.open candidate {path}:{i}')

print(f'Scanned TypeScript surfaces; hard findings={len(problems)}; review notes={len(notes)}')
for item in notes[:30]:
    print('NOTE', item)
for item in problems:
    print('BUG', item)
if problems:
    raise SystemExit(1)
print('FINAL_SCANNER_OK')
