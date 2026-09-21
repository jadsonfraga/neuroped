import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveCommercialScope, commercialConfirmationState, type CommercialScopeInput, type CommercialConfirmation } from "../../client/src/lib/commercialScope";

let assertions = 0;
function check(value: unknown, message: string) { assert.ok(value, message); assertions++; }
const ready: CommercialScopeInput = {
  accessMode: "remote", isAuthLoading: false, isAuthenticated: true, userId: "synthetic-user",
  clinicId: "synthetic-clinic", isClinicLoading: false, clinicError: null,
};
check(resolveCommercialScope(ready).kind === "institutional", "sessão remota completa requer licença");
check(resolveCommercialScope({ ...ready, accessMode: "local", clinicId: null }).kind === "individual", "instalação local explícita preservada");
for (const override of [
  { clinicId: null }, { clinicError: "falha de rede", clinicId: null },
  { clinicError: "falha de rede" }, { isClinicLoading: true },
  { isAuthLoading: true }, { isAuthenticated: false }, { userId: null },
  { accessMode: "checking" as const },
]) {
  const scope = resolveCommercialScope({ ...ready, ...override });
  check(scope.kind !== "individual" && scope.kind !== "institutional", `contexto incompleto recusa: ${JSON.stringify(override)}`);
}
for (const accessMode of ["remote", "local", "checking"] as const)
for (const isAuthLoading of [false, true])
for (const isAuthenticated of [false, true])
for (const isClinicLoading of [false, true])
for (const clinicId of [null, "synthetic-clinic"])
for (const clinicError of [null, "falha"]) {
  const result = resolveCommercialScope({ ...ready, accessMode, isAuthLoading, isAuthenticated, isClinicLoading, clinicId, clinicError });
  check(result.kind !== "individual" || (accessMode === "local" && !isAuthLoading), "nenhuma combinação remota/checking abre bypass individual");
}
const a = resolveCommercialScope(ready);
const b = resolveCommercialScope({ ...ready, clinicId: "other-clinic" });
const otherUser = resolveCommercialScope({ ...ready, userId: "other-user" });
check(a.kind === "institutional" && b.kind === "institutional" && otherUser.kind === "institutional" && a.key !== b.key && a.key !== otherUser.key, "chave separa identidade e tenant");

const snapshot = { clinic: "synthetic-clinic", license: "synthetic-license" };
const result: CommercialConfirmation<typeof snapshot> = { key: "user:clinic:feature", snapshot, status: "confirmed", denialCode: null };
check(commercialConfirmationState(result, result.key, snapshot) === "confirmed", "confirmação atual aceita");
check(commercialConfirmationState(null, result.key, snapshot) === "pending", "sem resposta não confirma");
check(commercialConfirmationState(result, result.key, null) === "pending", "contexto ausente invalida confirmação");
check(commercialConfirmationState(result, "other-user:clinic:feature", snapshot) === "pending", "outra identidade não reutiliza resposta");
check(commercialConfirmationState(result, "user:other-clinic:feature", snapshot) === "pending", "outra unidade não reutiliza resposta");
check(commercialConfirmationState(result, "user:clinic:other-feature", snapshot) === "pending", "outro material não reutiliza resposta");
check(commercialConfirmationState(result, result.key, { ...snapshot }) === "pending", "nova leitura da mesma licença exige nova confirmação");
check(commercialConfirmationState({ ...result, status: "denied" }, result.key, snapshot) === "denied", "recusa não vira permissão");

const hook = readFileSync("client/src/hooks/useCommercialLicense.ts", "utf8");
check(hook.includes("requestGeneration !== generation.current"), "respostas assíncronas antigas descartadas");
check(hook.includes("requestState.scope === scope"), "snapshot mascarado já no render da troca de contexto");
const workflow = readFileSync(".github/workflows/saas-commercial-canonical.yml", "utf8");
check(!/^\s+paths(?:-ignore)?:/m.test(workflow), "guard não omite dependências indiretas por filtros de caminhos");
for (const suite of ["saas-commercial-canonical", "saas-commercial-terms", "saas-commercial-materials", "saas-commercial-integrity", "saas-commercial-scope"]) {
  check(workflow.includes(`${suite}.test.ts`), `CI executa ${suite}`);
}
console.log(`✅ Escopo comercial: ${assertions} asserções; contexto, identidade, tenant, confirmação e cobertura de CI.`);
