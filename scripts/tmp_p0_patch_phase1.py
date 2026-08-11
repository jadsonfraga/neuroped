from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"pattern not found: {path}: {old[:80]!r}")
    p.write_text(text.replace(old, new, 1))


# Operational crypto: no JWT fallback, versioned key-id envelope.
replace(
    "functions/api/operations/_core.ts",
    '''export interface OperationsEnv {\n  DB?: D1Database;\n  NEUROPED_JWT_SECRET?: string;\n  OPERATIONAL_DATA_KEY?: string;\n}\n''',
    '''export interface OperationsEnv {\n  DB?: D1Database;\n  OPERATIONAL_DATA_KEY?: string;\n  OPERATIONAL_DATA_KEY_ID?: string;\n  OPERATIONAL_DATA_KEY_K1?: string;\n}\n''',
)

replace(
    "functions/api/operations/_core.ts",
    '''async function operationalKey(env: OperationsEnv): Promise<CryptoKey> {\n  const source = env.OPERATIONAL_DATA_KEY?.trim() || env.NEUROPED_JWT_SECRET?.trim();\n  if (!source || source.length < 32) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");\n  const material = new TextEncoder().encode(`neuroped-operational-v1:${source}`);\n  const digest = await crypto.subtle.digest("SHA-256", material);\n  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);\n}\n\nexport async function encryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const key = await operationalKey(env);\n  const iv = crypto.getRandomValues(new Uint8Array(12));\n  const ciphertext = await crypto.subtle.encrypt(\n    { name: "AES-GCM", iv },\n    key,\n    new TextEncoder().encode(value),\n  );\n  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;\n}\n\nexport async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const [version, ivB64, cipherB64] = value.split(".");\n  if (version !== "v1" || !ivB64 || !cipherB64) return null;\n  try {\n    const key = await operationalKey(env);\n    const plain = await crypto.subtle.decrypt(\n      { name: "AES-GCM", iv: base64ToBytes(ivB64) },\n      key,\n      base64ToBytes(cipherB64),\n    );\n    return new TextDecoder().decode(plain);\n  } catch {\n    return null;\n  }\n}\n''',
    '''function operationalSecretFor(env: OperationsEnv, keyId: string): string {\n  const activeId = env.OPERATIONAL_DATA_KEY_ID?.trim() || "k1";\n  const active = env.OPERATIONAL_DATA_KEY?.trim() ?? "";\n  if (keyId === activeId && active.length >= 32) return active;\n  if (keyId === "k1") {\n    const archived = env.OPERATIONAL_DATA_KEY_K1?.trim() ?? "";\n    if (archived.length >= 32) return archived;\n    if (activeId === "k1" && active.length >= 32) return active;\n  }\n  throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");\n}\n\nasync function operationalKey(secret: string, keyId: string): Promise<CryptoKey> {\n  const material = new TextEncoder().encode(`neuroped-operational-v2:${keyId}:${secret}`);\n  const digest = await crypto.subtle.digest("SHA-256", material);\n  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);\n}\n\nexport async function encryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const keyId = env.OPERATIONAL_DATA_KEY_ID?.trim() || "k1";\n  if (!/^[a-z0-9][a-z0-9_-]{0,31}$/i.test(keyId)) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");\n  const secret = operationalSecretFor(env, keyId);\n  const key = await operationalKey(secret, keyId);\n  const iv = crypto.getRandomValues(new Uint8Array(12));\n  const ciphertext = await crypto.subtle.encrypt(\n    { name: "AES-GCM", iv },\n    key,\n    new TextEncoder().encode(value),\n  );\n  return `v2.${keyId}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;\n}\n\nexport async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const [version, keyId, ivB64, cipherB64, ...extra] = value.split(".");\n  if (version !== "v2" || !keyId || !ivB64 || !cipherB64 || extra.length > 0) return null;\n  try {\n    const secret = operationalSecretFor(env, keyId);\n    const key = await operationalKey(secret, keyId);\n    const plain = await crypto.subtle.decrypt(\n      { name: "AES-GCM", iv: base64ToBytes(ivB64) },\n      key,\n      base64ToBytes(cipherB64),\n    );\n    return new TextDecoder().decode(plain);\n  } catch {\n    return null;\n  }\n}\n''',
)

# Health exposes booleans only; no secret material.
replace(
    "functions/api/health.ts",
    '''interface Env {\n  DB?: D1Database;\n  NEUROPED_JWT_SECRET?: string;\n}\n''',
    '''interface Env {\n  DB?: D1Database;\n  NEUROPED_JWT_SECRET?: string;\n  CLINICAL_DATA_KEY?: string;\n  CLINICAL_DATA_KEY_K1?: string;\n  CLINICAL_INDEX_KEY?: string;\n  CLINICAL_INDEX_KEY_K1?: string;\n  CLINICAL_REQUIRE_ENCRYPTED?: string;\n  OPERATIONAL_DATA_KEY?: string;\n  OPERATIONAL_DATA_KEY_K1?: string;\n}\n''',
)
replace(
    "functions/api/health.ts",
    '''    semanticSearch: {\n      status: "not_configured",\n      note: "Vectorize/pgvector not yet configured. Fallback to text search.",\n    },\n''',
    '''    clinicalEncryption: {\n      configured:\n        (env.CLINICAL_DATA_KEY?.trim().length ?? 0) >= 32 &&\n        (env.CLINICAL_DATA_KEY_K1?.trim().length ?? 0) >= 32 &&\n        (env.CLINICAL_INDEX_KEY?.trim().length ?? 0) >= 32 &&\n        (env.CLINICAL_INDEX_KEY_K1?.trim().length ?? 0) >= 32,\n      strict: env.CLINICAL_REQUIRE_ENCRYPTED?.trim().toLowerCase() === "true",\n    },\n    operationalEncryption: {\n      configured:\n        (env.OPERATIONAL_DATA_KEY?.trim().length ?? 0) >= 32 &&\n        (env.OPERATIONAL_DATA_KEY_K1?.trim().length ?? 0) >= 32,\n      jwtFallback: false,\n    },\n    semanticSearch: {\n      status: "not_configured",\n      note: "Vectorize/pgvector not yet configured. Fallback to text search.",\n    },\n''',
)

# Production D1 must never seed plaintext clinical rows again.
Path("db/seed.d1.sql").write_text('''-- NeuroPed D1 production seed intentionally empty.\n-- Demo content is supplied in-memory by the UI/API fallback and must never be\n-- persisted as clinical plaintext after the encrypted-at-rest migration.\nSELECT 1;\n''')

# Provisioning must create the blind-index schema before any future use.
replace(
    ".github/workflows/provision-d1.yml",
    '''          $WRANGLER d1 execute "$D1_NAME" --remote --yes \\\n            --file=./db/migrations/0004_consents.sql\n          consent_columns="$($WRANGLER d1 execute "$D1_NAME" --remote \\\n''',
    '''          $WRANGLER d1 execute "$D1_NAME" --remote --yes \\\n            --file=./db/migrations/0004_consents.sql\n          $WRANGLER d1 execute "$D1_NAME" --remote --yes \\\n            --file=./db/migrations/0010_clinical_field_encryption.sql\n          consent_columns="$($WRANGLER d1 execute "$D1_NAME" --remote \\\n''',
)

print("phase1 patches applied")
