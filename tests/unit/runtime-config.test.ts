import assert from "node:assert/strict";
import { boundedIntegerEnv, requiredBoundedIntegerEnv, RuntimeConfigurationError } from "../../server/lib/runtimeConfig";

const prior = { ...process.env };
try {
  delete process.env.TEST_BOUNDED_INT;
  assert.equal(boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), 7);
  process.env.TEST_BOUNDED_INT = "9";
  assert.equal(boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), 9);
  for (const value of ["NaN", "3x", "0", "11", "1.5", "-2", "999999999999999999999999"]) {
    process.env.TEST_BOUNDED_INT = value;
    assert.throws(() => boundedIntegerEnv("TEST_BOUNDED_INT", 7, 1, 10), RuntimeConfigurationError);
  }
  delete process.env.TEST_BOUNDED_INT;
  assert.throws(() => requiredBoundedIntegerEnv("TEST_BOUNDED_INT", 1, 10), RuntimeConfigurationError);
} finally {
  process.env = prior;
}
console.log("✓ configuração numérica rejeita NaN, frações e valores fora da faixa");
