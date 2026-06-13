import assert from "node:assert/strict";
import { canAccessPatient, canAccessScaleResult } from "../../server/lib/ownership";

const admin = { id: "admin-1", role: "admin" };
const userA = { id: "user-a", role: "professional" };
const userB = { id: "user-b", role: "professional" };

const patientA = { ownerUserId: "user-a" };
const patientB = { ownerUserId: "user-b" };
const unownedPatient = { ownerUserId: null };

assert.equal(canAccessPatient(admin, patientA), true, "admin acessa qualquer paciente");
assert.equal(canAccessPatient(userA, patientA), true, "dono acessa seu paciente");
assert.equal(canAccessPatient(userA, patientB), false, "usuario A nao acessa paciente do usuario B");
assert.equal(canAccessPatient(userA, unownedPatient), false, "paciente sem dono nao e publico");

assert.equal(
  canAccessScaleResult(userA, { appliedByUserId: "user-a" }, patientB),
  true,
  "aplicador acessa resultado que aplicou",
);
assert.equal(
  canAccessScaleResult(userA, { appliedByUserId: "user-b" }, patientA),
  true,
  "dono do paciente acessa resultado do seu paciente",
);
assert.equal(
  canAccessScaleResult(userA, { appliedByUserId: "user-b" }, patientB),
  false,
  "usuario A nao acessa resultado de paciente do usuario B",
);
assert.equal(canAccessScaleResult(admin, { appliedByUserId: "user-b" }, patientB), true, "admin acessa resultados");

console.log("ownership tests ok");
