import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
for (const path of ["client/src/components/AssinaturaIcpPanel.tsx", "client/src/pages/receita-c1-express.tsx"]) {
  const source = readFileSync(path, "utf8");
  test(path + " exige uma entrada nova e não reaproveita a senha após verificar ou assinar", () => {
    for (const operation of ["verificar", "gerarEAssinar"]) {
      const start = source.indexOf("async function " + operation);
      assert.notEqual(start, -1);
      const operationSource = source.slice(start, source.indexOf("\n  }", start));
      assert.match(operationSource, /const password = senha;\s*setSenha\(""\);/);
      assert.match(operationSource, /unlockCertificateFromAccount\([^\n]+password\)/);
      assert.match(operationSource, /finally\s*\{[\s\S]*?new Uint8Array\(ephemeralPfx\)\.fill\(0\)/);
      assert.doesNotMatch(operationSource, /setP12\(candidate\)|setP12\(activeP12\)/);
    }
    assert.doesNotMatch(source, /onKeyDown=[^\n]+gerarEAssinar/);
    const remoteLoad = source.slice(source.indexOf("    if (remoteCertificateVault) {"), source.indexOf("    } else {\n      void loadCertificate"));
    assert.doesNotMatch(remoteLoad, /loadCertificate\(user\)/);
    assert.match(source, /disabled=\{[^\n]+\(!p12 && !accountCertificate\)[^\n]+!senha/);
    assert.match(source, /if \(epoch !== getAuthSessionEpoch\(\)\) return;\s+downloadBytes\(signed/);
  });
}
