// Regressão (diagnóstico 07/11/2026, achado 3): Memória clínica, Conecta e a
// prévia do Portal da família liam e gravavam nas tabelas legadas *_demo (por
// dono, sem clínica) mesmo em sessão LIVE autenticada. Decisão do responsável:
// bloquear em LIVE até existir backend vinculado à clínica.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const notice = read("client/src/components/LiveLegacyBlockedNotice.tsx");
assert.match(notice, /accessMode === "remote" && isAuthenticated/, "bloqueio vale para sessão remota autenticada");
assert.match(notice, /não foram apagados/, "aviso declara que dados anteriores não foram apagados");

for (const [file, fn] of [
  ["client/src/pages/memoria-clinica.tsx", "MemoriaClinica"],
  ["client/src/pages/conecta.tsx", "Conecta"],
]) {
  const src = read(file);
  const page = src.slice(src.indexOf(`export default function ${fn}Page()`));
  assert.ok(page.length > 0, `${file}: página padrão existe`);
  // O bloqueio decide ANTES de montar o conteúdo que consulta /api/patients,
  // /api/memory ou /api/conecta: nenhum hook de dados roda em LIVE.
  assert.match(page, /useLiveLegacyBlocked\(\)[\s\S]*if \(blocked\)[\s\S]*LiveLegacyBlockedNotice[\s\S]*return <\w+Content \/>/, `${file}: bloqueio antes do conteúdo`);
  assert.equal(/useQuery|apiRequest|useMutation/.test(page), false, `${file}: wrapper não consulta dados`);
}

const portal = read("client/src/pages/portal-familia.tsx");
assert.match(portal, /const canPreviewDocuments = accessMode === "local";/, "prévia legada só no modo local");
assert.match(portal, /enabled: canPreviewDocuments && !!patientId/, "consulta legada depende da prévia local");
assert.match(portal, /painel Portal da família/, "LIVE aponta para o painel vinculado à clínica");

console.log("✓ módulos legados bloqueados em LIVE: memória clínica, Conecta e prévia do portal");
