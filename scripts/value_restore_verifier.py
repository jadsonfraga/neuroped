"""Integrity verifier for an authorized, isolated SQLite recovery.

The executable accepts NO database path: it only creates its own synthetic fixture.
For controlled operational use, the library takes already-authorized connections and a
trusted pre-incident manifest/key. Never derive the baseline from the restored target.
No PHI, row values or HMAC key are emitted. This does not implement D1 Time Travel,
production copying, encryption-key recovery, retention policy or a signed evidence store.
"""
from __future__ import annotations
import base64
import hashlib
import hmac
import json
from pathlib import Path
import secrets
import sqlite3
import tempfile
import time
from typing import Any

MAX_ROWS_PER_TABLE = 1_000_000


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _cell(value: Any) -> list[Any]:
    if value is None: return ['null', None]
    if isinstance(value, bytes): return ['blob', base64.b64encode(value).decode('ascii')]
    if isinstance(value, int): return ['integer', value]
    if isinstance(value, float): return ['real', value]
    if isinstance(value, str): return ['text', value]
    raise ValueError('RESTORE_UNSUPPORTED_CELL')


def manifest(connection: sqlite3.Connection, key: bytes) -> dict[str, Any]:
    # A savepoint keeps all schema/data reads in one consistent SQLite snapshot.
    connection.execute("SAVEPOINT value_restore_manifest")
    try:
        return _manifest_snapshot(connection, key)
    finally:
        connection.execute("RELEASE value_restore_manifest")


def _manifest_snapshot(connection: sqlite3.Connection, key: bytes) -> dict[str, Any]:
    if not isinstance(key, bytes) or len(key) < 32: raise ValueError('RESTORE_STRONG_KEY_REQUIRED')
    if connection.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise ValueError('RESTORE_INTEGRITY_FAILURE')
    if connection.execute('PRAGMA foreign_key_check').fetchone() is not None:
        raise ValueError('RESTORE_FOREIGN_KEY_FAILURE')
    schema = connection.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").fetchall()
    schema_digest = hashlib.sha256(json.dumps(schema, ensure_ascii=True, separators=(',', ':')).encode()).hexdigest()
    tables: dict[str, Any] = {}
    for (name,) in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name NOT LIKE 'sqlite_%' OR name='sqlite_sequence') ORDER BY name"):
        # Sorting keyed row digests preserves multiplicity but ignores insertion order.
        # Bound memory; exceeding the limit fails rather than attesting a partial table.
        digests: list[bytes] = []
        for row in connection.execute(f'SELECT * FROM {_quote(name)}'):
            encoded = json.dumps([_cell(cell) for cell in row], ensure_ascii=True, allow_nan=False, separators=(',', ':')).encode()
            digests.append(hmac.new(key, encoded, hashlib.sha256).digest())
            if len(digests) > MAX_ROWS_PER_TABLE: raise ValueError('RESTORE_ROW_LIMIT')
        table_hash = hmac.new(key, name.encode(), hashlib.sha256)
        for digest in sorted(digests): table_hash.update(digest)
        tables[name] = {'rows': len(digests), 'hmacSha256': table_hash.hexdigest()}
    if not tables: raise ValueError('RESTORE_EMPTY_SCHEMA')
    return {'schemaSha256': schema_digest, 'tables': tables,
            'userVersion': connection.execute('PRAGMA user_version').fetchone()[0],
            'applicationId': connection.execute('PRAGMA application_id').fetchone()[0]}


def verify_restored(connection: sqlite3.Connection, trusted_manifest: dict[str, Any], key: bytes) -> dict[str, Any]:
    actual = manifest(connection, key)
    if any(actual[key] != trusted_manifest.get(key) for key in ('schemaSha256', 'userVersion', 'applicationId')):
        raise ValueError('RESTORE_SCHEMA_MISMATCH')
    if actual['tables'] != trusted_manifest.get('tables'):
        raise ValueError('RESTORE_CONTENT_MISMATCH')
    return {'verified': True, 'engine': 'sqlite3', 'schemaSha256': actual['schemaSha256'],
            'tableCount': len(actual['tables']), 'rowCount': sum(table['rows'] for table in actual['tables'].values()),
            'checks': ['integrity', 'foreign_keys', 'schema', 'all_table_counts', 'keyed_content_checksums']}


def run_synthetic_rehearsal() -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix='neuroped-synthetic-restore-') as directory:
        root = Path(directory)
        paths = [root / name for name in ('synthetic-source.sqlite3', 'synthetic-backup.sqlite3', 'synthetic-restored.sqlite3')]
        source, backup, restored = [sqlite3.connect(path) for path in paths]
        try:
            for path in paths: path.chmod(0o600)
            source.executescript('''
              PRAGMA foreign_keys=ON;
              CREATE TABLE clinics(id TEXT PRIMARY KEY);
              CREATE TABLE records(id TEXT PRIMARY KEY, clinic_id TEXT REFERENCES clinics(id), payload BLOB);
              INSERT INTO clinics VALUES ('synthetic-alpha'), ('synthetic-beta');
              INSERT INTO records VALUES ('synthetic-sentinel', 'synthetic-alpha', X'010203');
            ''')
            key = secrets.token_bytes(32)
            # Trusted checkpoint is taken BEFORE the simulated incident.
            trusted = manifest(source, key)
            checkpoint_at = time.perf_counter()
            source.backup(backup)
            source.execute("DELETE FROM records WHERE id='synthetic-sentinel'")
            source.commit()
            incident_at = time.perf_counter()
            backup.backup(restored)
            result = verify_restored(restored, trusted, key)
            if restored.execute("SELECT COUNT(*) FROM records WHERE id='synthetic-sentinel'").fetchone()[0] != 1:
                raise ValueError('RESTORE_READ_TEST_FAILED')
            recovered_at = time.perf_counter()
            return {'schemaVersion': 'neuroped-restore-evidence-v1', 'dataset': 'synthetic_projection',
                    'engine': 'python-sqlite3', 'restoreVerified': True, 'verification': result,
                    'syntheticRpoSeconds': incident_at - checkpoint_at,
                    'syntheticRtoSeconds': recovered_at - incident_at,
                    'productionRpoSeconds': None, 'productionRtoSeconds': None,
                    'productionDataAccessed': False, 'productionRecoveryVerified': False,
                    'clinicalDecryptionVerified': False, 'readTestVerified': True}
        finally:
            source.close(); backup.close(); restored.close()


if __name__ == '__main__':
    import sys
    if len(sys.argv) != 1: raise SystemExit('No input paths accepted. This command is synthetic-only.')
    print(json.dumps(run_synthetic_rehearsal(), indent=2, sort_keys=True))
