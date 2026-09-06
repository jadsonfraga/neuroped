import assert from "node:assert/strict";
import {
  assessPreviousKeyRetirement,
  type EnvelopeInventory,
} from "../../functions/api/admin/_operationalEnvelopes";

const inventory: EnvelopeInventory = {
  missingTables: [],
  columns: [
    {
      table: "appointments",
      column: "guardian_name_encrypted",
      buckets: [
        { version: "v2", keyId: "k3", malformedKeyId: false, total: 1 },
      ],
    },
  ],
};

const orphan = assessPreviousKeyRetirement(inventory, "k1", "k2");
assert.equal(orphan.citingPrevious, 0);
assert.equal(orphan.citingUnconfiguredKey, 1);
assert.equal(orphan.unreadable, 1);
assert.equal(
  orphan.previousKeyRetirementSafe,
  false,
  "v2 com keyId válido fora do keyring atual/anterior deve bloquear aposentadoria",
);

const current: EnvelopeInventory = {
  ...inventory,
  columns: [
    {
      table: "appointments",
      column: "guardian_name_encrypted",
      buckets: [
        { version: "v2", keyId: "k2", malformedKeyId: false, total: 1 },
      ],
    },
  ],
};
const safe = assessPreviousKeyRetirement(current, "k1", "k2");
assert.equal(safe.citingUnconfiguredKey, 0);
assert.equal(safe.unreadable, 0);
assert.equal(safe.previousKeyRetirementSafe, true);

console.log("✓ operational crypto: terceiro keyId válido é fail-closed");
