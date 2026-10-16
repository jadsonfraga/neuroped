"""Portal da família: executa a migração 0034 e os SQL reais de consumo/auditoria em SQLite.

Os SQL são extraídos de functions/api/family-portal/_shared.ts (não duplicados).
Dados fictícios. Prova: uso único/limitado atômico, expiração, revogação, auditoria
condicionada ao consumo, sem coluna de conteúdo na trilha.
"""
import re
import sqlite3
import pathlib

root = pathlib.Path(__file__).resolve().parents[2]
shared = (root / "functions/api/family-portal/_shared.ts").read_text()


def sql_const(name: str) -> str:
    m = re.search(r"export const " + name + r" = `(.*?)`;", shared, re.S)
    assert m, name
    return m.group(1)


CONSUME = sql_const("CONSUME_SHARE_SQL")
AUDIT_IF = sql_const("AUDIT_IF_CHANGED_SQL")

db = sqlite3.connect(":memory:")
db.executescript(
    "create table clinics(id text primary key, name text, status text);"
    "create table live_patients(id text primary key);"
    "create table users(id text primary key);"
)
db.executescript((root / "db/migrations/0034_family_portal.sql").read_text())
db.execute("insert into clinics values('c1','Clínica Fictícia','active')")
db.execute("insert into live_patients values('p1')")
db.execute("insert into users values('u1')")


def new_share(sid, max_views, expires="2099-01-01T00:00:00.000Z", status="active"):
    db.execute(
        "insert into family_portal_shares(id,clinic_id,patient_id,created_by_user_id,token_hash,status,expires_at,max_views,content_encrypted,encryption_version)"
        " values(?,?,?,?,?,?,?,?,?,?)",
        (sid, "c1", "p1", "u1", "h-" + sid, status, expires, max_views, "cifrado", "v1"),
    )


def consume(sid, now="2026-10-20T10:00:00.000Z"):
    """Replica o batch do handler: UPDATE + 2 auditorias condicionadas a changes()."""
    cur = db.execute(CONSUME, (now, now, "family-portal-lgpd-2026-10", sid, "c1", now))
    changed = cur.rowcount
    db.execute(AUDIT_IF, ("a1-" + sid + now, "c1", sid, "consent_accepted", "v", now))
    db.execute(AUDIT_IF, ("a2-" + sid + now, "c1", sid, "content_viewed", "v", now))
    return changed


# uso único: a segunda abertura é recusada
new_share("s1", 1)
assert consume("s1") == 1
assert consume("s1", "2026-10-20T10:00:01.000Z") == 0
assert db.execute("select view_count from family_portal_shares where id='s1'").fetchone()[0] == 1

# uso limitado a 3
new_share("s2", 3)
assert [consume("s2", f"2026-10-20T10:00:0{i}.000Z") for i in range(5)] == [1, 1, 1, 0, 0]

# expirado e revogado não consomem
new_share("s3", 3, expires="2026-10-01T00:00:00.000Z")
assert consume("s3") == 0
new_share("s4", 3, status="revoked")
assert consume("s4") == 0

# auditoria só existe quando houve consumo (2 linhas por abertura consumida)
counts = dict(db.execute("select share_id, count(*) from family_portal_audit_log group by share_id").fetchall())
assert counts == {"s1": 2, "s2": 6}, counts

# consentimento registrado no primeiro acesso e mantido
row = db.execute("select first_consented_at, consent_version from family_portal_shares where id='s2'").fetchone()
assert row == ("2026-10-20T10:00:00.000Z", "family-portal-lgpd-2026-10"), row

# constraints
for bad in ("update family_portal_shares set view_count=99 where id='s2'",
            "update family_portal_shares set status='x' where id='s2'"):
    try:
        db.execute(bad)
        raise SystemExit("constraint deveria falhar: " + bad)
    except sqlite3.IntegrityError:
        pass

# a trilha não tem coluna para nome, conteúdo, token, paciente ou IP
cols = {r[1] for r in db.execute("pragma table_info(family_portal_audit_log)")}
assert cols == {"id", "clinic_id", "share_id", "action", "consent_version", "created_at"}, cols
share_cols = {r[1] for r in db.execute("pragma table_info(family_portal_shares)")}
assert "token" not in share_cols and "content" not in share_cols  # só token_hash e content_encrypted
print("family-portal-sql ok")
