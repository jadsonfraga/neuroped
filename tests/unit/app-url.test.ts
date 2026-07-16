import assert from "node:assert/strict";
import { buildAppHashUrl } from "../../client/src/lib/appUrl";

assert.equal(
  buildAppHashUrl(
    "/verificar",
    { h: "abc 123" },
    "https://jadsonfraga.github.io/neuroped/index.html#/receita-c1",
  ),
  "https://jadsonfraga.github.io/neuroped/#/verificar?h=abc+123",
);
assert.equal(
  buildAppHashUrl("verificar", {}, "https://neuroped.pages.dev/#/"),
  "https://neuroped.pages.dev/#/verificar",
);

console.log("✓ URLs de QR preservam o base path do deploy");
