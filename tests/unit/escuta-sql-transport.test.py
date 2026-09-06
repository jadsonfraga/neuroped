"""Verify D1 transport against the complete real migration corpus, not a fake schema."""
import importlib.util
from pathlib import Path
import re
import sqlite3

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('transport', root / 'scripts/escuta-sql-transport.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
split_sql = module.split_sql
d1_statements = module.d1_statements
files = [root / 'db/schema.d1.sql'] + [p for p in sorted((root / 'db/migrations').glob('*.sql')) if not re.match(r'000[12]_', p.name)]
a, b = sqlite3.connect(':memory:'), sqlite3.connect(':memory:')
count = 0
for path in files:
    source = path.read_text()
    a.executescript(source)
    for statement in d1_statements(source):
        b.execute(statement)
        count += 1
names = lambda db: db.execute("SELECT type,name,tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").fetchall()
assert names(a) == names(b)
for kind, name, _ in names(a):
    if kind == 'table':
        assert a.execute(f'PRAGMA table_info("{name}")').fetchall() == b.execute(f'PRAGMA table_info("{name}")').fetchall()
assert len(split_sql("CREATE TRIGGER t AFTER INSERT ON x BEGIN INSERT INTO x VALUES('a;b'); UPDATE x SET v='--/*xx*/'; END;")) == 1
assert d1_statements("BEGIN TRANSACTION; CREATE TABLE x(v TEXT); COMMIT;") == ['CREATE TABLE x(v TEXT);']
assert d1_statements("BEGIN IMMEDIATE; SELECT 'END; COMMIT;'; ROLLBACK;") == ["SELECT 'END; COMMIT;';"]
assert d1_statements("CREATE TRIGGER t AFTER INSERT ON x BEGIN UPDATE x SET v=CASE WHEN v='a' THEN 'b' ELSE v END; END;")[0].startswith('CREATE TRIGGER')
assert split_sql("SELECT 'a;--/*z*/'; -- quote's comment\n /* ; */ SELECT 2;") == ["SELECT 'a;--/*z*/';", 'SELECT 2;']
for bad in ("SELECT 'unterminated", '/* unterminated'):
    try:
        split_sql(bad)
    except ValueError:
        pass
    else:
        raise AssertionError('Malformed SQL must fail closed')
print(f'PASS D1 SQL transport: {len(files)} files, {count} statements, {len(names(a))} schema objects; top-level transaction wrappers removed; comments/literals/triggers preserved.')
