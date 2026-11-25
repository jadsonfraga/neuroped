import assert from "node:assert/strict";
import { test } from "node:test";
import { ownerFacsimileEligible, verifyFacsimileObject } from "../../functions/api/me/_pdfFacsimile";

test("somente a identidade nominal que segue proprietária da clínica selecionada recebe a imagem", () => {
  const base = { userId: "owner-test", clinicId: "clinic-test", clinicRole: "owner", clinicStatus: "active",
    expectedUser: "owner-test", expectedClinic: "clinic-test", passwordChangeRequired: false };
  assert.equal(ownerFacsimileEligible(base), true);
  for (const candidate of [
    { userId: "another-owner" }, { clinicId: "another-clinic" }, { clinicRole: "clinic_admin" },
    { clinicRole: "professional" }, { clinicRole: "assistant" }, { clinicStatus: "suspended" },
    { passwordChangeRequired: true }, { expectedUser: "" }, { expectedClinic: "" },
  ]) assert.equal(ownerFacsimileEligible({ ...base, ...candidate }), false);
});

test("objeto trocado, não JPEG ou grande demais não é usado", async () => {
  const approved = Uint8Array.of(255, 216, 255, 224, 1, 2, 255, 217);
  const hash = Buffer.from(await crypto.subtle.digest("SHA-256", approved)).toString("hex");
  assert.equal(await verifyFacsimileObject(approved, hash), true);
  assert.equal(await verifyFacsimileObject(Uint8Array.of(255, 216, 255, 225, 1, 2, 255, 217), hash), false);
  assert.equal(await verifyFacsimileObject(Uint8Array.of(1, 2, 3), hash), false);
  assert.equal(await verifyFacsimileObject(new Uint8Array(120_001), hash), false);
});

test("o cadastro exige JSON pequeno com um único JPEG", async () => {
  const { readBoundedFacsimile } = await import("../../functions/api/me/_pdfFacsimile");
  const create = (body: unknown) => new Request("https://example.test/api/me/pdf-facsimile", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const bytes = Uint8Array.of(255, 216, 255, 224, 1, 2, 255, 217);
  const base64 = Buffer.from(bytes).toString("base64");
  assert.deepEqual(await readBoundedFacsimile(create({ jpeg: base64 })), { bytes, media: "image/jpeg" });
  assert.equal(await readBoundedFacsimile(create({ jpeg: base64, tenant: "external" })), null);
  assert.equal(await readBoundedFacsimile(create({ jpeg: "!@#$" })), null);
  assert.equal(await readBoundedFacsimile(create({ jpeg: "A".repeat(160_300) })), null);
  assert.equal(await readBoundedFacsimile(create(null)), null);
});
