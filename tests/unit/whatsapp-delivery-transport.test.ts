import test from "node:test";
import assert from "node:assert/strict";
import { sendReleasedPdf, normalizeDeliveryPhone, type DeliveryConfig, type DeliveryClaim } from "../../functions/lib/whatsappDelivery.ts";

const config: DeliveryConfig = { enabled: true, clinicalMediaApproved: true,
  graphVersion: "v99.0", phoneNumberId: "123456", accessToken: "synthetic",
  templateName: "documento_liberado", language: "pt_BR" };
const bytes = new TextEncoder().encode("%PDF-1.4\nSYNTHETIC TEST ONLY");
const sha256 = Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex");
const claim: DeliveryClaim = { clinicId: "clinic-test", patientId: "patient-test",
  documentId: "doc-test", versionId: "v-test", recipient: "5587999990000", sha256, bytes };

test("normalization refuses missing digits and invalid characters", () => {
  assert.equal(normalizeDeliveryPhone("(87) 99999-0000"), claim.recipient);
  assert.equal(normalizeDeliveryPhone("99999-0000"), null);
  assert.equal(normalizeDeliveryPhone("87 99999-0000 ext 2"), null);
});

test("disabled, unapproved, wrong hash and denied authorization never call provider", async () => {
  let calls = 0;
  const deps = { isStillAuthorized: async () => false,
    fetcher: (async () => { calls++; throw Error("unexpected network"); }) as typeof fetch };
  for (const [cfg, c] of [[{ ...config, enabled: false }, claim],
    [{ ...config, clinicalMediaApproved: false }, claim],
    [config, { ...claim, sha256: "0".repeat(64) }], [config, claim]] as const) {
    assert.equal((await sendReleasedPdf(cfg, c, deps)).status, "blocked");
  }
  assert.equal(calls, 0);
});

test("uploads exact bytes, rechecks authorization and sends approved template to exact recipient", async () => {
  let checks = 0;
  let calls = 0;
  const result = await sendReleasedPdf(config, claim, {
    isStillAuthorized: async c => { assert.equal(c.patientId, claim.patientId); checks++; return true; },
    fetcher: (async (url, init) => {
      calls++;
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer synthetic");
      if (calls === 1) {
        assert.match(String(url), /\/media$/);
        const file = (init?.body as FormData).get("file") as File;
        assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);
        assert.equal(file.name, "documento.pdf");
        return Response.json({ id: "1234567" });
      }
      assert.equal(checks, 2);
      assert.match(String(url), /\/messages$/);
      const message = JSON.parse(String(init?.body));
      assert.equal(message.to, claim.recipient);
      assert.equal(message.type, "template");
      assert.equal(message.template.components[0].parameters[0].document.id, "1234567");
      assert.doesNotMatch(JSON.stringify(message), /patient-test|clinic-test|doc-test/);
      return Response.json({ messages: [{ id: "wamid.synthetic" }] });
    }) as typeof fetch,
  });
  assert.deepEqual(result, { status: "accepted", messageId: "wamid.synthetic" });
  assert.equal(calls, 2);
});

test("revocation after upload blocks message", async () => {
  let checks = 0, calls = 0;
  const result = await sendReleasedPdf(config, claim, {
    isStillAuthorized: async () => ++checks === 1,
    fetcher: (async () => { calls++; return Response.json({ id: "1234567" }); }) as typeof fetch,
  });
  assert.deepEqual(result, { status: "blocked", code: "AUTHORIZATION_REVOKED" });
  assert.equal(calls, 1);
});

test("ambiguous message outcome is not retried or marked delivered", async () => {
  let calls = 0;
  const result = await sendReleasedPdf(config, claim, {
    isStillAuthorized: async () => true,
    fetcher: (async () => { if (++calls === 1) return Response.json({ id: "1234567" }); throw Error("network"); }) as typeof fetch,
  });
  assert.equal(result.status, "uncertain");
  assert.equal(calls, 2);
});
