from pathlib import Path
import json


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        if new in text:
            return
        raise SystemExit(f"replacement anchor missing: {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))


core = Path("functions/api/operations/_core.ts")
text = core.read_text()
text = text.replace(
    "  OPERATIONAL_DATA_KEY?: string;\n}",
    "  OPERATIONAL_DATA_KEY?: string;\n  OPERATIONAL_DATA_KEY_PREVIOUS?: string;\n}",
    1,
)
text = text.replace(
    '''async function operationalKey(env: OperationsEnv): Promise<CryptoKey> {\n  const source = env.OPERATIONAL_DATA_KEY?.trim();\n  if (!source || source.length < 32) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");\n  const material = new TextEncoder().encode(`neuroped-operational-v1:${source}`);\n  const digest = await crypto.subtle.digest("SHA-256", material);\n  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);\n}\n''',
    '''async function operationalKey(env: OperationsEnv, explicitSource?: string): Promise<CryptoKey> {\n  const source = explicitSource?.trim() || env.OPERATIONAL_DATA_KEY?.trim();\n  if (!source || source.length < 32) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");\n  const material = new TextEncoder().encode(`neuroped-operational-v1:${source}`);\n  const digest = await crypto.subtle.digest("SHA-256", material);\n  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);\n}\n''',
    1,
)
old_decrypt = '''export async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const [version, ivB64, cipherB64] = value.split(".");\n  if (version !== "v1" || !ivB64 || !cipherB64) return null;\n  try {\n    const key = await operationalKey(env);\n    const plain = await crypto.subtle.decrypt(\n      { name: "AES-GCM", iv: base64ToBytes(ivB64) },\n      key,\n      base64ToBytes(cipherB64),\n    );\n    return new TextDecoder().decode(plain);\n  } catch {\n    return null;\n  }\n}\n'''
new_decrypt = '''export async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {\n  if (!value) return null;\n  const [version, ivB64, cipherB64] = value.split(".");\n  if (version !== "v1" || !ivB64 || !cipherB64) return null;\n  for (const source of [env.OPERATIONAL_DATA_KEY, env.OPERATIONAL_DATA_KEY_PREVIOUS]) {\n    if (!source?.trim()) continue;\n    try {\n      const key = await operationalKey(env, source);\n      const plain = await crypto.subtle.decrypt(\n        { name: "AES-GCM", iv: base64ToBytes(ivB64) },\n        key,\n        base64ToBytes(cipherB64),\n      );\n      return new TextDecoder().decode(plain);\n    } catch {\n      // Durante rotação, tenta explicitamente a chave anterior; nunca o JWT.\n    }\n  }\n  return null;\n}\n'''
if old_decrypt in text:
    text = text.replace(old_decrypt, new_decrypt, 1)
elif new_decrypt not in text:
    raise SystemExit("decryptText anchor missing")
core.write_text(text)

p = Path("package.json")
pkg = json.loads(p.read_text())
quick = pkg["scripts"]["test:quick-wins"]
prefix = "node --import tsx tests/unit/clinical-encryption-contract.test.ts && node tests/unit/clinical-encryption-static.test.mjs && "
if not quick.startswith(prefix):
    pkg["scripts"]["test:quick-wins"] = prefix + quick
p.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n")

print("P0 repository patches applied")
