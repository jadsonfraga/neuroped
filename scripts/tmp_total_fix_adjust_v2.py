from pathlib import Path

path = Path("tests/unit/loose-ends-regression.test.mjs")
text = path.read_text("utf-8")
old = 'assert.match(buildInfo, /JSON\\.parse\\(readFileSync\\(packagePath/);'
new = 'assert.match(buildInfo, /JSON\\.parse\\(readFileSync\\(new URL/);'
if old not in text:
    raise SystemExit("assertion antiga de versão não encontrada")
path.write_text(text.replace(old, new, 1), "utf-8")
print("Contrato de versão alinhado ao gerador atual")
