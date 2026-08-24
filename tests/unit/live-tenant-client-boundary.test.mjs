import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clinicContext = readFileSync("client/src/contexts/ClinicContext.tsx", "utf8");

assert.match(
  clinicContext,
  /await\s+queryClient\.cancelQueries\(\)/,
  "troca de clínica precisa cancelar queries em trânsito antes de reidratar outro tenant",
);
assert.match(
  clinicContext,
  /queryClient\.clear\(\)/,
  "troca de clínica precisa destruir o cache/observers clínicos do tenant anterior",
);
assert.match(
  clinicContext,
  /setActiveClinicIdState\(null\);[\s\S]{0,180}persistClinicId\(null\);/,
  "contexto tenant anterior precisa ficar vazio antes da limpeza de caches",
);
assert.match(
  clinicContext,
  /const\s+generation\s*=\s*\+\+switchGeneration\.current/,
  "switch concorrente precisa ter geração para impedir conclusão fora de ordem",
);
assert.match(
  clinicContext,
  /if\s*\(generation\s*!==\s*switchGeneration\.current\)\s*return;/,
  "switch antigo não pode sobrescrever uma seleção tenant mais nova",
);
assert.match(
  clinicContext,
  /persistClinicId\(clinicId\);[\s\S]{0,180}window\.location\.reload\(\)/,
  "novo clinic_id deve ser persistido somente após a limpeza e seguido de hard reload do shell",
);
assert.doesNotMatch(
  clinicContext,
  /await\s+clearClinicalClientCaches\(\);[\s\S]{0,160}setActiveClinicIdState\(clinicId\);[\s\S]{0,160}persistClinicId\(clinicId\);/,
  "LIVE não deve voltar ao padrão frágil de reciclar o mesmo shell React entre tenants",
);

assert.match(
  clinicContext,
  /isLoading:\s*isAuthLoading/,
  "ClinicProvider precisa observar o estado transitório do bootstrap de autenticação",
);
assert.match(
  clinicContext,
  /if\s*\(accessMode\s*===\s*"checking"\s*\|\|\s*isAuthLoading\)\s*return;/,
  "bootstrap de auth não pode apagar a seleção tenant persistida antes da revalidação da sessão",
);
const bootstrapGuard = clinicContext.indexOf('if (accessMode === "checking" || isAuthLoading) return;');
const definitiveClear = clinicContext.indexOf('if (accessMode !== "remote" || !isAuthenticated || user?.mustChangePassword)');
assert.ok(bootstrapGuard >= 0 && definitiveClear > bootstrapGuard, "guard transitório deve preceder a limpeza definitiva de tenant");
const betweenBootstrapAndDefinitiveClear = clinicContext.slice(bootstrapGuard, definitiveClear);
assert.doesNotMatch(
  betweenBootstrapAndDefinitiveClear,
  /persistClinicId\(null\)|setActiveClinicIdState\(null\)/,
  "estado auth transitório não pode limpar clinic_id nem contexto ativo",
);

console.log("[live-tenant-client-boundary] ✓ troca zera/cache-clears/recarrega e bootstrap preserva a seleção até auth ficar definitivo");
