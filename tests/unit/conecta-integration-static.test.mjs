import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("client/src/App.tsx");
const nav = read("client/src/data/navigation.ts");
const page = read("client/src/pages/conecta.tsx");
const engine = read("client/src/lib/conectaEngine.ts");
const contract = read("shared/conecta.ts");
const serverRoutes = read("server/routes.ts");
const conectaServer = read("server/routes/conecta.ts");
const d1 = read("functions/api/conecta/index.ts");
const migration = read("db/migrations/0005_conecta_events.sql");

assert.match(app, /import\("@\/pages\/conecta"\)/, "Conecta deve ser lazy-loaded");
assert.match(app, /path="\/conecta"/, "rota /conecta deve existir");
assert.match(nav, /href: "\/conecta", label: "NeuroPed Conecta"/, "navegação deve apontar para /conecta");
assert.match(serverRoutes, /registerConectaRoutes\(app\)/, "backend Express deve registrar domínio Conecta");
assert.match(conectaServer, /CREATE TABLE IF NOT EXISTS conecta_events/, "Conecta deve ter armazenamento próprio");
assert.doesNotMatch(conectaServer, /INSERT INTO scale_results/, "Conecta não pode reutilizar tabela de escalas");
assert.match(conectaServer, /payload_encrypted/, "payload clínico livre deve ser cifrado no backend real");
assert.match(page, /persistentSecure(Get|Set)/, "modo local deve usar armazenamento persistente cifrado");
assert.match(page, /Nenhum dado demonstrativo foi usado como substituto/, "falha real não pode cair para fixture demo");
assert.match(d1, /conecta_events_demo/, "D1 de demonstração deve usar tabela explicitamente demo");
assert.match(d1, /is_demo = 1/, "D1 deve restringir leitura/escrita ao domínio demo");
assert.match(migration, /CHECK \(is_demo = 1\)/, "schema demo deve possuir trava física");

const protectedSource = [page, engine, contract, conectaServer, d1].join("\n");
assert.doesNotMatch(protectedSource, /Lucas Demo/i, "módulo nativo não pode carregar paciente fictício fixo");
assert.doesNotMatch(protectedSource, /neuroped-conecta\.lovable\.app/i, "módulo nativo não pode depender da versão Lovable");
assert.doesNotMatch(protectedSource, /neuroped-conecta\.vercel\.app/i, "módulo nativo não pode depender do proxy standalone");

for (const forbidden of [
  /\b(aumente|reduza|suspenda|inicie)\s+(a\s+)?dose\b/i,
  /\bdiagnóstico\s+confirmado\b/i,
  /\bconfirma\s+(o\s+)?diagnóstico\b/i,
]) {
  assert.doesNotMatch(protectedSource, forbidden, `microcopy perigosa detectada: ${forbidden}`);
}

assert.match(contract, /Não constitui diagnóstico, prescrição ou ajuste de tratamento/i);
assert.match(page, /Ausência de registro não é interpretada como normalidade/i);
assert.match(page, /não coloque nada na boca/i);
assert.match(page, /SAMU 192/i);

console.log("✓ Conecta integration: rota, storage, isolamento e microcopy aprovados");
