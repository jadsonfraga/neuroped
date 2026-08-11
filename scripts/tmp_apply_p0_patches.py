from pathlib import Path
import json


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        if new in text:
            return
        raise SystemExit(f"replacement anchor missing: {path}: {old[:80]!r}")
    p.write_text(text.replace(old, new, 1))


replace_once(
    "functions/api/operations/_core.ts",
    '  NEUROPED_JWT_SECRET?: string;\n  OPERATIONAL_DATA_KEY?: string;',
    '  OPERATIONAL_DATA_KEY?: string;',
)
replace_once(
    "functions/api/operations/_core.ts",
    '  const source = env.OPERATIONAL_DATA_KEY?.trim() || env.NEUROPED_JWT_SECRET?.trim();',
    '  const source = env.OPERATIONAL_DATA_KEY?.trim();',
)

p = Path("package.json")
pkg = json.loads(p.read_text())
quick = pkg["scripts"]["test:quick-wins"]
prefix = "node --import tsx tests/unit/clinical-encryption-contract.test.ts && node tests/unit/clinical-encryption-static.test.mjs && "
if not quick.startswith(prefix):
    pkg["scripts"]["test:quick-wins"] = prefix + quick
p.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n")

print("P0 repository patches applied")
