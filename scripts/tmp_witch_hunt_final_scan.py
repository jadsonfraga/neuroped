from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []
notes: list[str] = []


def read(path: str) -> str:
    return (ROOT / path).read_text('utf-8')


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)

# 1) Superfícies administrativas/clinicamente mutáveis não podem fingir sucesso.
audit = read('functions/api/audit-log.ts')
require('DEMO_LOGS' not in audit and 'Log de auditoria simulado' not in audit, 'audit-log ainda possui fallback fictício')
require('DB_REQUIRED' in audit and 'status = 503' not in audit or '503' in audit, 'audit-log sem DB não está explicitamente fail-closed')
require('T23:59:59Z' not in audit and 'created_at < ?' in audit, 'audit-log ainda perde frações no último segundo do dia')
require('parseAuditLogQuery' in audit and 'nextAuditIsoDay' in audit, 'audit-log perdeu normalização temporal/paginação')

# 2) Escritas de agenda que mudam estado/horário devem usar comparação do estado lido.
public_booking = read('functions/api/public-booking.ts')
operations = read('functions/api/operations/index.ts')
core = read('functions/api/operations/_core.ts')
require('STALE_APPOINTMENT' in public_booking, 'booking público não detecta requisição obsoleta')
require('STALE_APPOINTMENT' in operations, 'agenda profissional não detecta requisição obsoleta')
require('releaseSlotLocksAfterSuccessfulMutationStatement' in public_booking, 'booking público pode liberar lock sem mutação vencedora')
require('releaseSlotLocksAfterSuccessfulMutationStatement' in operations, 'agenda profissional pode liberar lock sem mutação vencedora')
require('slotLockStatementsForAppointmentState' in public_booking, 'remarcação não condiciona novos locks ao estado persistido')
require('changes() = 1' in core, 'helper de lock não está condicionado à mutação imediatamente anterior')

# Nenhum handler operacional deve voltar ao helper incondicional para transições.
for path in ('functions/api/public-booking.ts', 'functions/api/operations/index.ts'):
    s = read(path)
    require('releaseSlotLocksStatement(' not in s, f'{path}: voltou a usar liberação incondicional de locks')

# 3) Mutações por ID que foram endurecidas precisam continuar verificando affected rows.
for marker, message in [
    ('Regra não encontrada.', 'delete_rule não confirma affected rows'),
    ('Bloqueio não encontrado.', 'delete_block não confirma affected rows'),
    ('Consulta não encontrada.', 'pagamento/consulta não confirma affected rows'),
    ('Entrada da lista de espera não encontrada.', 'waitlist não confirma affected rows'),
    ('Avaliação não encontrada.', 'review não confirma affected rows'),
    ('Notificação não encontrada.', 'notificação não confirma affected rows'),
    ('Serviço não encontrado.', 'serviço não confirma affected rows'),
    ('Perfil público não encontrado.', 'perfil não confirma affected rows'),
]:
    require(marker in operations, message)
require(operations.count('meta?.changes') >= 8, 'agenda perdeu checagens de linhas afetadas')

# 4) Painel: consultas próximas e métricas não podem depender de LIMIT visual.
require("status IN ('requested','confirmed','checked_in','in_care')" in operations and 'LIMIT 250' in operations, 'lista operacional não prioriza agenda futura ativa')
for sql_marker in [
    'today_count',
    'upcoming_count',
    'requested_count',
    'no_show_30d',
    'expected_cents',
    'paid_cents',
    "COUNT(*) AS count FROM waitlist_entries",
    "COUNT(*) AS count FROM appointment_reviews",
    "COUNT(*) AS count FROM notification_outbox",
]:
    require(sql_marker in operations, f'métrica global ausente: {sql_marker}')
metrics_block = operations[operations.find('const metrics = {'):operations.find('const metrics = {') + 1200]
require('fullAppointments.filter' not in metrics_block and 'waitlist.filter' not in metrics_block, 'métricas voltaram a usar coleções truncadas')

# 5) UI da agenda precisa distinguir falha transacional de falha do refresh.
agenda = read('client/src/pages/agenda.tsx')
require('Promise<boolean>' in agenda, 'mutação da Agenda perdeu retorno de sucesso real')
require('A alteração foi salva, mas a tela não conseguiu atualizar' in agenda, 'UI volta a confundir refetch com rollback')
require('if (saved) setStaffEmail("")' in agenda, 'formulário de equipe volta a apagar dados após falha')

# 6) Multipart só é permitido no bridge explícito; demais mutações continuam JSON-only.
middleware = read('functions/api/_middleware.ts')
require('bodyPath === "/api/integrations/boaconsulta/import"' in middleware, 'exceção multipart deixou de ser específica')
require('ct.includes("multipart/form-data")' in middleware, 'bridge BoaConsulta perdeu multipart')
require('!ct.includes("application/json") && !multipartAllowed' in middleware, 'middleware deixou de bloquear outros bodies não-JSON')

# 7) Escritas clínicas sem D1: checar contratos permanentes e handlers conhecidos.
clinical_test = read('tests/unit/no-fake-clinical-write.test.ts')
require('PATCH' in clinical_test and 'DELETE' in clinical_test and 'DB_REQUIRED' in clinical_test, 'trava de falso write clínico ficou incompleta')
for path in ('functions/api/patients/[id].ts', 'functions/api/results/[id].ts'):
    s = read(path)
    require('DB_REQUIRED' in s and '503' in s, f'{path}: escrita sem DB deixou de falhar fechado')

# 8) Conecta: deletes precisam confirmar que a linha realmente existiu até o DELETE.
cf_conecta = read('functions/api/conecta/[id].ts')
ex_conecta = read('server/routes/conecta.ts')
require('deletion.meta?.changes' in cf_conecta and 'NOT_FOUND' in cf_conecta, 'Conecta D1 perdeu proteção TOCTOU')
require('deletion.changes !== 1' in ex_conecta and 'NOT_FOUND' in ex_conecta, 'Conecta Express perdeu proteção TOCTOU')

# 9) Query parsing: padrões de NaN já identificados não podem reaparecer no API.
for p in (ROOT / 'functions/api').rglob('*.ts'):
    s = p.read_text('utf-8')
    if re.search(r'Math\.(?:max|min)\([^\n]*parseInt\([^\n]*(?:searchParams|url\.)', s):
        failures.append(f'{p.relative_to(ROOT)}: parseInt pode propagar NaN em limite/paginação')

# 10) Browser mutations raw: logout é única exceção deliberada, pois limpa tokens antes da I/O.
for p in (ROOT / 'client/src').rglob('*.ts*'):
    lines = p.read_text('utf-8').splitlines()
    for i, line in enumerate(lines):
        if 'await fetch(' not in line:
            continue
        window = '\n'.join(lines[i:min(len(lines), i + 28)])
        if not re.search(r'method:\s*["\'](?:POST|PATCH|PUT|DELETE)["\']', window):
            continue
        rel = p.relative_to(ROOT).as_posix()
        if rel == 'client/src/lib/authClient.ts' and '/api/auth/logout' in window:
            notes.append('logout remoto permanece best-effort após limpeza local de credenciais')
            continue
        if not re.search(r'\.ok\b|status\s*[<>=]|apiRequest\(', window):
            failures.append(f'{rel}:{i+1}: mutação fetch sem checagem observável de HTTP')

# 11) Reverse-tabnabbing: nova aba externa deve isolar opener; links _blank precisam rel.
for p in (ROOT / 'client/src').rglob('*.tsx'):
    lines = p.read_text('utf-8').splitlines()
    for i, line in enumerate(lines):
        if 'target="_blank"' in line:
            window = ' '.join(lines[max(0, i-2):min(len(lines), i+4)])
            if 'rel=' not in window:
                failures.append(f'{p.relative_to(ROOT)}:{i+1}: target=_blank sem rel')
for p in (ROOT / 'client/src').rglob('*.ts*'):
    lines = p.read_text('utf-8').splitlines()
    for i, line in enumerate(lines):
        if 'window.open(' not in line:
            continue
        window = '\n'.join(lines[i:min(len(lines), i + 12)])
        # Janelas vazias usadas só para impressão também devem zerar opener.
        if '.opener = null' not in window and 'noopener' not in window and 'noreferrer' not in window:
            failures.append(f'{p.relative_to(ROOT)}:{i+1}: window.open sem isolamento de opener')

# 12) Não aceitar retorno do modo demo como escrita clínica real.
for p in (ROOT / 'functions/api').rglob('*.ts'):
    s = p.read_text('utf-8')
    if not re.search(r'onRequest(?:Post|Patch|Put|Delete)', s):
        continue
    # Detecta explicitamente os padrões de falso sucesso já vistos.
    if re.search(r'if \(!env\.DB\)[\s\S]{0,450}?(?:updated:\s*true|deleted:\s*true|status:\s*201|,\s*201\))', s):
        failures.append(f'{p.relative_to(ROOT)}: mutação clínica aparenta sucesso sem persistência')

print('=== FINAL WITCH-HUNT PASS ===')
print(f'High-confidence findings: {len(failures)}')
for item in failures:
    print(f'BUG: {item}')
print(f'Explicitly triaged exceptions: {len(notes)}')
for item in notes:
    print(f'NOTE: {item}')

if failures:
    raise SystemExit(1)
print('PASS: nenhuma nova falha de alta confiança nas invariantes auditadas.')
