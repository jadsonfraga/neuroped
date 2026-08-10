from __future__ import annotations
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.ts', '.tsx', '.js', '.mjs', '.cjs'}
IGNORE = {'node_modules', 'dist', 'coverage', '.git', 'attached_assets'}
files = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in EXTS and not any(part in IGNORE for part in p.parts) and 'tmp_definitive' not in p.name]
failures: list[str] = []
notes: list[str] = []

def read(path: str) -> str:
    return (ROOT / path).read_text('utf-8')

def require(cond: bool, msg: str) -> None:
    if not cond:
        failures.append(msg)

# 1) Produção: nenhum flag demo pode contornar a ausência de DB em rota protegida.
mw = read('functions/api/_middleware.ts')
prod_guard = mw[mw.find('const requestPathBeforeAuth'):mw.find('const authorization = await authorizeClinicalApi')]
require('isProductionBeforeAuth' in prod_guard and '!env.DB' in prod_guard, 'middleware perdeu guard fail-closed de produção sem D1')
require('demoWritesEnabledBeforeAuth' not in prod_guard, 'flag demo ainda contorna o guard fail-closed de produção')
require('RATE_LIMIT_KV' in mw and 'await kv.get(' in mw and 'await kv.put(' in mw, 'KV distribuído deixou de reforçar rate-limit')

# 2) Login não pode enumerar existência/estado e deve pagar custo criptográfico sentinela.
cf_login = read('functions/api/auth/login.ts')
ex_login = read('server/auth/routes.ts')
require('DUMMY_PASSWORD_HASH' in cf_login, 'Cloudflare login sem dummy PBKDF2 para usuário inexistente')
require('DUMMY_BCRYPT_HASH' in ex_login, 'Express login sem dummy bcrypt para usuário inexistente')
for marker in ('ACCOUNT_DISABLED', 'ACCOUNT_LOCKED'):
    require(marker not in cf_login, f'Cloudflare login reexpôs estado de conta: {marker}')
require('status(423)' not in ex_login and 'AUTH_LOCKED' not in ex_login, 'Express login reexpôs estado de lockout')

# 3) Auth temporal/concorrente: timestamps malformados e desativação concorrente falham fechados.
cf_shared = read('functions/api/auth/_shared.ts')
cf_sessions = read('functions/api/auth/_sessions.ts')
password = read('server/lib/password.ts')
require('!Number.isFinite(until) || until > Date.now()' in cf_shared, 'lock D1 malformado voltou a falhar aberto')
require('!Number.isFinite(until) || until > Date.now()' in password, 'lock Express malformado voltou a falhar aberto')
require('!Number.isFinite(currentExpiry)' in cf_sessions, 'refresh D1 ainda aceita expiry NaN')
require('julianday(expires_at) > julianday(?)' in cf_sessions, 'queries de sessão D1 não validam tempo como data')
require('FROM users u' in cf_sessions and 'u.is_active = 1' in cf_sessions, 'rotação D1 não revalida conta ativa atomicamente')
require('isExpiredOrInvalidTimestamp(stored.expiresAt)' in ex_login, 'refresh Express ainda aceita expiry malformado')
require('REFRESH_RACE' in ex_login and 'revoked.changes !== 1' in ex_login, 'rotação Express perdeu proteção concorrente')

# 4) Clinical Core: correções não podem bifurcar supersessão append-only.
cf_core = read('functions/api/clinical-core/index.ts')
ex_core = read('server/routes/clinical-core.ts')
for source, name in ((cf_core, 'Cloudflare'), (ex_core, 'Express')):
    require('STALE_SUPERSESSION' in source, f'{name} Clinical Core perdeu stale supersession')
    require("status = 'active'" in source, f'{name} Clinical Core não condiciona supersessão ao estado ativo')
require('WHERE changes() = 1' in cf_core, 'D1 correction insert perdeu vínculo com UPDATE vencedor')

# 5) Arquivos: erro remoto ≠ not-found e estado é revalidado após awaits sensíveis.
files_route = read('server/routes/files.ts')
storage = read('server/lib/cloudStorage.ts')
require('freshPatient' in files_route and 'patientReferenceDecision(req.user!, freshPatient)' in files_route, 'upload não revalida paciente após assinatura')
require('FILE_STATE_CHANGED' in files_route and 'eq(filesTable.isDeleted, false)' in files_route, 'confirm não detecta delete concorrente')
require('freshFile' in files_route and 'freshFile.isDeleted' in files_route, 'download não revalida soft-delete após gerar URL')
require(files_route.find('const deleted = db.update') < files_route.find('await deleteObject(deleted.storageKey)'), 'delete remoto ocorre antes de revogar estado local')
require('isStorageNotFoundError' in storage and 'httpStatusCode === 404' in storage, 'HeadObject voltou a colapsar indisponibilidade em 404')
require('throw new CloudStorageError("Falha ao consultar o objeto no storage.")' in storage, 'HeadObject não propaga indisponibilidade')
require('head.etag' not in files_route, 'ETag não-verificado voltou a ser gravado como SHA-256')

# 6) Configuração numérica não deve chegar a runtime como NaN.
for path in ('server/index.ts', 'server/routes/files.ts', 'server/lib/email.ts', 'server/lib/db.ts', 'server/lib/db-enhanced.ts'):
    source = read(path)
    if re.search(r'parseInt\([^\n]*process\.env|parseInt\([^\n]*(?:PORT|SMTP_PORT|DATABASE_POOL_MAX|MAX_FILE_SIZE)', source):
        failures.append(f'{path}: parseInt direto em configuração numérica reapareceu')
config = read('server/lib/runtimeConfig.ts')
require('Number.isSafeInteger' in config and 'RuntimeConfigurationError' in config, 'parser numérico estrito ausente')

# 7) Não aceitar falso write sem persistência em handlers clínicos.
for p in (ROOT / 'functions/api').rglob('*.ts'):
    s = p.read_text('utf-8')
    if not re.search(r'onRequest(?:Post|Patch|Put|Delete)', s):
        continue
    if re.search(r'if \(!env\.DB\)[\s\S]{0,450}?(?:updated:\s*true|deleted:\s*true|status:\s*201|,\s*201\))', s):
        failures.append(f'{p.relative_to(ROOT)}: mutação aparenta sucesso sem D1')

# 8) Browser: mutação raw sem observar status; logout é exceção idempotente deliberada.
for p in (ROOT / 'client/src').rglob('*.ts*'):
    lines = p.read_text('utf-8').splitlines()
    for i, line in enumerate(lines):
        if 'fetch(' not in line:
            continue
        window = '\n'.join(lines[i:min(len(lines), i + 35)])
        if not re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', window):
            continue
        rel = p.relative_to(ROOT).as_posix()
        if '/api/auth/logout' in window:
            notes.append('logout remoto permanece best-effort após limpeza local de credenciais')
            continue
        if not re.search(r'\b(?:response|res|r)\.ok\b|\b(?:response|res|r)\.status\b|apiRequest\(', window):
            failures.append(f'{rel}:{i+1}: mutação fetch sem checagem HTTP')

# 9) Reverse-tabnabbing / execução dinâmica.
for p in (ROOT / 'client/src').rglob('*.ts*'):
    lines = p.read_text('utf-8').splitlines()
    for i, line in enumerate(lines):
        if 'window.open(' in line:
            window = '\n'.join(lines[i:min(len(lines), i+14)])
            if '.opener = null' not in window and 'noopener' not in window and 'noreferrer' not in window:
                failures.append(f'{p.relative_to(ROOT)}:{i+1}: window.open sem isolamento')
        if 'target="_blank"' in line:
            window = ' '.join(lines[max(0,i-2):min(len(lines), i+4)])
            if 'rel=' not in window:
                failures.append(f'{p.relative_to(ROOT)}:{i+1}: target=_blank sem rel')
for p in files:
    s = p.read_text('utf-8')
    if re.search(r'\beval\s*\(|\bnew Function\s*\(', s):
        failures.append(f'{p.relative_to(ROOT)}: execução dinâmica detectada')

# 10) Storage clínico em browser não pode reaparecer via setItem cru.
clinical = ('patient', 'pacient', 'diagnos', 'medic', 'clinical', 'clinico', 'consulta', 'prontuario', 'scale', 'escala', 'conecta', 'laudo')
for p in (ROOT / 'client/src').rglob('*.ts*'):
    rel = p.relative_to(ROOT).as_posix()
    for i, line in enumerate(p.read_text('utf-8').splitlines(), 1):
        low = line.lower()
        if ('localstorage.setitem' in low or 'sessionstorage.setitem' in low) and any(k in low for k in clinical):
            if 'secureStorage' not in rel and 'useSecureScaleDraft' not in rel:
                failures.append(f'{rel}:{i}: possível payload clínico escrito diretamente no browser storage')

# 11) SW: APIs e superfícies clínicas continuam Network Only.
sw = read('client/public/sw.js')
for marker in ('url.pathname.startsWith("/api/")', '/patients', '/consultations', '/documents'):
    require(marker in sw, f'Service Worker perdeu guard de cache clínico: {marker}')

# 12) Dívidas explícitas de alto risco em código executável (docs/testes não contam).
for p in files:
    rel = p.relative_to(ROOT).as_posix()
    if not rel.startswith(('client/src/', 'server/', 'functions/api/', 'shared/')):
        continue
    for i, line in enumerate(p.read_text('utf-8').splitlines(), 1):
        if re.search(r'\b(?:FIXME|SECURITY TODO|NOT IMPLEMENTED)\b', line, re.I):
            notes.append(f'{rel}:{i}: {line.strip()}')

print('=== DEFINITIVE SATURATION SCAN ===')
print(f'Files scanned: {len(files)}')
print(f'High-confidence findings: {len(failures)}')
for item in failures:
    print(f'BUG: {item}')
print(f'Triaged notes: {len(notes)}')
for item in notes[:80]:
    print(f'NOTE: {item}')
if failures:
    raise SystemExit(1)
print('PASS: nenhuma nova falha de alta confiança nas classes auditadas.')
