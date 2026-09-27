#!/usr/bin/env node

import { createHash } from "node:crypto";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let payload;
try {
  payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
} catch {
  console.error("Saída do Wrangler não é JSON válido; fingerprint recusado.");
  process.exit(1);
}

const envelope = Array.isArray(payload) ? payload[0] : payload;
const row = envelope?.results?.[0];
if (!envelope?.success || !row || typeof row !== "object" || Array.isArray(row)) {
  console.error("Saída do Wrangler não contém exatamente uma linha de resultado válida.");
  process.exit(1);
}

const expectedKeys = [
  "encrypted_event_envelopes",
  "encrypted_patient_envelopes",
  "event_envelope_bytes",
  "patient_envelope_bytes",
  "represented_patient_clinics",
  "schema_indexes",
  "schema_tables",
  "schema_triggers",
  "synthetic_clinics",
  "synthetic_events",
  "synthetic_memberships",
  "synthetic_patients",
  "synthetic_users",
  "tenant_scoped_patients",
];
const actualKeys = Object.keys(row).sort();
if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
  console.error("A consulta de fingerprint não retornou o conjunto exato de invariantes esperado.");
  process.exit(1);
}

for (const key of expectedKeys) {
  if (!Number.isSafeInteger(row[key]) || row[key] < 0) {
    console.error(`Invariante inválida em ${key}; esperado inteiro não negativo.`);
    process.exit(1);
  }
}

const canonical = JSON.stringify(
  Object.fromEntries(expectedKeys.map((key) => [key, row[key]])),
);
process.stdout.write(`${createHash("sha256").update(canonical).digest("hex")}\n`);
