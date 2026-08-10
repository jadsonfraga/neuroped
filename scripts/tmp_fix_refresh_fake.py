from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'tests/unit/refresh-sessions.test.ts'
s = p.read_text('utf-8')
anchor = '''      run: async () => {\n        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("VALUES (?, ?, ?, ?")) {'''
replacement = '''      run: async () => {\n        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("SELECT ?, id, ?, ?")) {\n          const [id, familyId, tokenHash, expiresAt, createdAt, userId] = values.map(String);\n          this.sessions.set(id, {\n            id,\n            user_id: userId,\n            family_id: familyId,\n            token_hash: tokenHash,\n            parent_session_id: null,\n            replaced_by_session_id: null,\n            expires_at: expiresAt,\n            revoked_at: null,\n            revoke_reason: null,\n            created_at: createdAt,\n            last_used_at: null,\n          });\n          return { meta: { changes: 1 } };\n        }\n        if (sql.includes("INSERT INTO auth_refresh_sessions") && sql.includes("VALUES (?, ?, ?, ?")) {'''
if s.count(anchor) != 1:
    raise SystemExit('refresh fake anchor not found uniquely')
p.write_text(s.replace(anchor, replacement, 1), 'utf-8')
print('refresh session fake updated')
