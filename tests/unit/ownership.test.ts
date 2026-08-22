import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canAccessPatient,
  canAccessScaleResult,
  patientReferenceDecision,
} from "../../server/lib/ownership";
import { patientToStorage } from "../../server/lib/patientCrypto";
import { canAccessOwnedPatient } from "../../functions/api/auth/_authorization";

const admin = { id: "admin-1", role: "admin" };
const userA = { id: "user-a", role: "professional" };
const userB = { id: "user-b", role: "professional" };

const patientA = { ownerUserId: "user-a" };
const patientB = { ownerUserId: "user-b" };
const unownedPatient = { ownerUserId: null };

assert.equal(canAccessPatient(admin, patientA), true, "admin acessa qualquer paciente");
assert.equal(canAccessPatient(userA, patientA), true, "dono acessa seu paciente");
assert.equal(canAccessPatient(userB, patientB), true, "usuario B acessa seu proprio paciente");
assert.equal(canAccessPatient(userA, patientB), false, "usuario A nao acessa paciente do usuario B");
assert.equal(canAccessPatient(userA, unownedPatient), false, "paciente sem dono nao e publico");

assert.equal(
  canAccessScaleResult(
    userA,
    { patientId: "patient-b", appliedByUserId: "user-a" },
    patientB,
  ),
  false,
  "aplicador não ganha leitura de resultado vinculado a paciente alheio",
);
assert.equal(
  canAccessScaleResult(
    userA,
    { patientId: "patient-a", appliedByUserId: "user-b" },
    patientA,
  ),
  true,
  "dono do paciente acessa resultado do seu paciente",
);
assert.equal(
  canAccessScaleResult(
    userA,
    { patientId: "patient-b", appliedByUserId: "user-b" },
    patientB,
  ),
  false,
  "usuario A nao acessa resultado de paciente do usuario B",
);
assert.equal(canAccessScaleResult(admin, { appliedByUserId: "user-b" }, patientB), true, "admin acessa resultados");
assert.equal(
  canAccessScaleResult(userA, { patientId: null, appliedByUserId: "user-a" }),
  true,
  "aplicador acessa resultado avulso sem paciente",
);

assert.equal(patientReferenceDecision(userA, null), "not_found");
assert.equal(patientReferenceDecision(userA, patientB), "forbidden");
assert.equal(patientReferenceDecision(userA, patientA), "allowed");
assert.equal(patientReferenceDecision(admin, patientB), "allowed");

const d1Admin = { id: "admin-1", email: "admin@test", name: "Admin", role: "admin", mustChangePassword: false };
const d1ProfessionalA = { id: "user-a", email: "a@test", name: "A", role: "professional", mustChangePassword: false };
const d1ProfessionalB = { id: "user-b", email: "b@test", name: "B", role: "professional", mustChangePassword: false };
assert.equal(canAccessOwnedPatient(d1Admin, null), true, "admin recupera registro D1 legado sem owner");
assert.equal(canAccessOwnedPatient(d1ProfessionalA, "user-a"), true, "profissional acessa paciente D1 próprio");
assert.equal(canAccessOwnedPatient(d1ProfessionalA, "user-b"), false, "profissional não acessa paciente D1 alheio");
assert.equal(canAccessOwnedPatient(d1ProfessionalB, null), false, "registro legado sem owner falha fechado para não-admin");

process.env.NEUROPED_MASTER_KEY =
  process.env.NEUROPED_MASTER_KEY || "0123456789abcdef".repeat(4);
const patchedStorage = patientToStorage({ name: "Paciente", ownerUserId: "user-a" });
assert.equal(patchedStorage.ownerUserId, "user-a", "atualização criptografada preserva ownership");

const routesSource = readFileSync(new URL("../../server/routes.ts", import.meta.url), "utf8");
assert.match(
  routesSource,
  /app\.post\(\s*"\/api\/results",\s*requireAuth,\s*requireProfessional,\s*writeRateLimit/,
  "criação de resultado exige perfil profissional",
);
assert.match(
  routesSource,
  /patientReferenceDecision\(req\.user!, patient\)/,
  "resultados e solicitações LGPD validam referência ao paciente",
);
assert.doesNotMatch(
  routesSource,
  /if \(result\.appliedByUserId === _req\.user!\.id\) return true/,
  "aplicador não contorna ownership ao listar resultados vinculados",
);
const fileRoutesSource = readFileSync(
  new URL("../../server/routes/files.ts", import.meta.url),
  "utf8",
);
assert.match(
  fileRoutesSource,
  /patientReferenceDecision\(req\.user!, patient\)/,
  "upload não associa arquivo a paciente alheio",
);

console.log("ownership tests ok");
