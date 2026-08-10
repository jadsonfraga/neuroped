from pathlib import Path

path = Path("tests/unit/cloudflare-input-limits.test.ts")
text = path.read_text("utf-8")

replacements = [
    (
        '''assert.equal(scaleResponse.status, 201);\nconst scaleBody = await scaleResponse.json() as { id: string; responses: unknown[] };\nassert.match(scaleBody.id, uuidPattern);\nassert.equal(scaleBody.responses.length, 150);\nassert.notEqual(scaleBody.id, resultBody.id, "IDs clínicos são UUIDs independentes");''',
        '''assert.equal(\n  scaleResponse.status,\n  503,\n  "payload extenso válido passa pela validação e falha fechado sem D1",\n);\nconst scaleBody = await scaleResponse.json() as { code?: string };\nassert.equal(scaleBody.code, "DB_REQUIRED");''',
    ),
    (
        '''assert.equal(documentResponse.status, 201);\nassert.match((await documentResponse.json() as { id: string }).id, uuidPattern);''',
        '''assert.equal(documentResponse.status, 503);\nassert.equal((await documentResponse.json() as { code?: string }).code, "DB_REQUIRED");''',
    ),
    (
        '''assert.equal(consultationResponse.status, 201);\nassert.match((await consultationResponse.json() as { id: string }).id, uuidPattern);''',
        '''assert.equal(consultationResponse.status, 503);\nassert.equal((await consultationResponse.json() as { code?: string }).code, "DB_REQUIRED");''',
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Trecho esperado não encontrado em {path}: {old[:60]}")
    text = text.replace(old, new, 1)

path.write_text(text, "utf-8")
print("Contrato cloudflare-input-limits alinhado a DB_REQUIRED")
