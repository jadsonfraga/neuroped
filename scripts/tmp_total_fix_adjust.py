from pathlib import Path

path = Path("tests/unit/loose-ends-regression.test.mjs")
text = path.read_text("utf-8")
text = text.replace(
    'assert.match(portalFamilia, /remoteAuthenticatedProfessional/);',
    'assert.match(portalFamilia, /const canPreviewDocuments/);\nassert.match(portalFamilia, /accessMode === "remote" && isAuthenticated/);',
)
text = text.replace(
    'assert.match(portalFamilia, /Nenhum dado clínico é liberado por esta tela pública/);',
    'assert.match(portalFamilia, /O ID do paciente nunca funciona como senha/);',
)
path.write_text(text, "utf-8")
print("Teste do Portal Família alinhado ao contrato atual")
