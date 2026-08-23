import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const provider = readFileSync("functions/api/billing/_provider.ts", "utf8");
const checkout = readFileSync("functions/api/billing/checkout.ts", "utf8");
const webhook = readFileSync("functions/api/billing/webhook.ts", "utf8");

assert.doesNotMatch(provider, /console\.(?:error|warn|log)\([^\n]*text(?:\.slice)?/);
assert.doesNotMatch(provider, /console\.(?:error|warn|log)\([^\n]*path[,)]/);
assert.match(provider, /provider_failure[\s\S]{0,180}status:\s*response\.status/);

// Os handlers podem registrar o objeto Error, mas não payloads, bodies de
// request, customerData ou o evento Asaas bruto.
for (const [name, source] of [["checkout", checkout], ["webhook", webhook]]) {
  assert.doesNotMatch(source, /console\.(?:error|warn|log)\([^\n]*(?:request\.json|customerData|event\s*[,)]|body\s*[,)])/,
    `${name} não pode serializar payload identificável em log`);
}

console.log("✓ billing logs: respostas do provedor, IDs de lifecycle e payloads identificáveis não são serializados");
