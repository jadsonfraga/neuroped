import assert from "node:assert/strict";
import { test } from "node:test";
import { clearAuth, getAuthSessionEpoch } from "../../client/src/lib/authClient";
import { loadCertificateFromAccount, saveCertificateToAccount, unlockCertificateFromAccount } from "../../client/src/lib/certificateVault";

test("novo login recupera apenas o envelope, exige senha e impede reuso em outra conta", async () => {
  const originalFetch = globalThis.fetch;
  const storage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  let payload: Record<string, unknown> | null = null;
  let writes = 0;
  Object.defineProperty(globalThis, "sessionStorage", {configurable: true, value: {getItem: () => null, removeItem: () => undefined}});
  globalThis.fetch = async (path, init) => {
    assert.equal(path, "/api/certificate-vault");
    if (init?.method === "PUT") {
      writes++;
      payload = JSON.parse(String(init.body));
      assert.deepEqual(Object.keys(payload ?? {}).sort(), ["ciphertext", "formatVersion", "iterations", "iv", "kdf", "salt"]);
      assert.ok(!String(init.body).includes("pw-test-only"));
      return Response.json({ok:true, updatedAt: "2026-01-01T00:00:00Z"});
    }
    return Response.json({certificate: {...payload, updatedAt: "2026-01-01T00:00:00Z"}});
  };
  const user = {id: "owner-synthetic", role: "admin"};
  const fixture = new TextEncoder().encode("test-only dummy envelope payload").buffer;
  const pw = "pw-test-only";
  try {
    const epoch = getAuthSessionEpoch();
    await saveCertificateToAccount(user, fixture, pw, epoch);
    const pending = saveCertificateToAccount(user, fixture, pw, epoch);
    clearAuth();
    await assert.rejects(pending, /Sessão alterada/);
    assert.equal(writes, 1);
    const envelope = await loadCertificateFromAccount(user);
    assert.ok(envelope);
    await assert.rejects(unlockCertificateFromAccount(user, envelope, ""));
    await assert.rejects(unlockCertificateFromAccount(user, envelope, "errada"));
    await assert.rejects(unlockCertificateFromAccount({...user, id: "other-synthetic"}, envelope, pw));
    assert.deepEqual(await unlockCertificateFromAccount(user, envelope, pw), fixture);
  } finally {
    globalThis.fetch = originalFetch;
    if (storage) Object.defineProperty(globalThis, "sessionStorage", storage);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
