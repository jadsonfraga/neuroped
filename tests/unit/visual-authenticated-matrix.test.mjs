import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * Contrato estático da prova visual autenticada.
 *
 * O gate de navegador (`npm run audit:visual-authenticated`) precisa de
 * Chromium; este teste roda em qualquer lugar e impede as três formas de a
 * cobertura P1 evaporar sem ninguém perceber:
 *
 *  1. a matriz encolher abaixo de 50 estados;
 *  2. os estados clínicos deixarem de proibir o gate de login (uma captura da
 *     tela de autenticação passando por "cobertura do prontuário");
 *  3. a fixture ganhar dado real ou credencial de produção.
 */

const read = (path) => fs.readFileSync(path, "utf8");
const audit = read("scripts/audit-visual-authenticated.mjs");
const fixture = read("scripts/lib/synthetic-clinical-api.mjs");
const runtime = read("scripts/lib/browser-audit-runtime.mjs");
const pkg = JSON.parse(read("package.json"));

// ─── 1. Tamanho e diversidade da matriz ───────────────────────────────────
const caseIds = [...audit.matchAll(/^\s*id: "([^"]+)",/gm)].map((match) => match[1]);
assert.ok(
  caseIds.length >= 50,
  `a matriz autenticada precisa de ao menos 50 estados; encontrados ${caseIds.length}`,
);
assert.equal(
  new Set(caseIds).size,
  caseIds.length,
  "estados da matriz não podem repetir id (a captura seria sobrescrita)",
);
assert.match(
  audit,
  /const MINIMUM_STATES = 50;/,
  "o piso de 50 estados deve continuar sendo verificado em tempo de execução",
);

const groups = new Set([...audit.matchAll(/group: "([^"]+)"/g)].map((match) => match[1]));
for (const required of [
  "Autenticação",
  "Cockpit",
  "Pacientes",
  "Prontuário",
  "Escalas",
  "Filtro",
  "Documentos",
  "Operação",
  "Assistência",
  "Sessão",
  "Confirmações destrutivas",
  "Autosave e salvamento",
]) {
  assert.ok(groups.has(required), `a matriz deve cobrir o grupo "${required}"`);
}

for (const viewport of ["mobileSmall", "mobile", "tablet", "desktop"]) {
  assert.ok(
    audit.includes(`viewport: "${viewport}"`),
    `a matriz deve exercitar o viewport ${viewport}`,
  );
}
for (const theme of ["light", "dark"]) {
  assert.ok(audit.includes(`theme: "${theme}"`), `a matriz deve exercitar o tema ${theme}`);
}
for (const scenario of ["empty", "hangingPatients", "failingPatients", "expiredSession", "multiTenant"]) {
  assert.ok(
    audit.includes(`scenario: "${scenario}"`),
    `a matriz deve exercitar o cenário ${scenario} (vazio, carregando, erro, sessão e tenant)`,
  );
}

// ─── 2. O par expect/forbid é o que impede aprovação no gate de login ─────
const forbidLoginCount = (audit.match(/forbid: \[LOGIN_FORM/g) ?? []).length
  + (audit.match(/LOGIN_FORM\]/g) ?? []).length;
assert.ok(
  forbidLoginCount >= 20,
  `estados clínicos devem proibir explicitamente o formulário de login; ocorrências: ${forbidLoginCount}`,
);
assert.match(
  audit,
  /estado-ausente:\$\{selector\}|estado-ausente:/,
  "a ausência de um estado esperado precisa reprovar o caso",
);
assert.match(
  audit,
  /estado-proibido:/,
  "a presença de um estado proibido precisa reprovar o caso",
);
for (const check of ["overflow-horizontal:", "foco-dialogo:", "axe:", "alvo-compacto:"]) {
  assert.ok(audit.includes(check), `o gate deve manter a verificação "${check}"`);
}
assert.match(
  audit,
  /impact === "critical" \|\| violation\.impact === "serious"/,
  "violações axe serious/critical devem reprovar",
);

// ─── 3. A fixture não pode virar porta para dado ou credencial real ───────
assert.match(
  fixture,
  /Sintético|sintétic/,
  "os registros da fixture devem se anunciar como sintéticos",
);
assert.match(
  fixture,
  /@neuroped\.invalid/,
  "a conta da fixture deve usar um domínio reservado e não roteável",
);
assert.doesNotMatch(
  fixture,
  /process\.env\.(?:NEUROPED_E2E_EMAIL|NEUROPED_E2E_PASSWORD|NEUROPED_JWT_SECRET|OPERATIONAL_DATA_KEY)/,
  "a fixture não pode ler credenciais reais do ambiente",
);
assert.doesNotMatch(
  fixture,
  /https?:\/\/(?!localhost|127\.0\.0\.1)/,
  "a fixture não pode falar com nenhum host externo",
);
assert.match(
  fixture,
  /if \(!authorized\(request\)\) \{\s*send\(response, 401/,
  "rota clínica da fixture deve exigir sessão, como a produção",
);
assert.match(
  fixture,
  /provenance/,
  "eventos do núcleo clínico da fixture devem carregar proveniência, como o contrato real",
);

// O bundle do cliente e o servidor de produção jamais importam a fixture.
for (const dir of ["client/src", "server", "functions"]) {
  const offenders = [];
  const walk = (path) => {
    for (const entry of fs.readdirSync(path, { withFileTypes: true })) {
      const full = `${path}/${entry.name}`;
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mjs|js)$/.test(entry.name) && read(full).includes("synthetic-clinical-api")) {
        offenders.push(full);
      }
    }
  };
  walk(dir);
  assert.deepEqual(offenders, [], `${dir} não pode importar a API sintética de auditoria`);
}

// ─── 4. Fiação de execução ────────────────────────────────────────────────
assert.equal(
  pkg.scripts["audit:visual-authenticated"],
  "node scripts/audit-visual-authenticated.mjs",
  "o gate autenticado deve ter script próprio",
);
assert.ok(
  pkg.scripts["verify:release"].includes("npm run audit:visual-authenticated"),
  "a suíte de release deve executar a prova visual autenticada",
);
assert.match(
  runtime,
  /apiHandler/,
  "o servidor de auditoria deve poder servir o contrato clínico na mesma origem",
);

console.log(
  `[visual-authenticated] ✓ matriz com ${caseIds.length} estados, ${groups.size} grupos, fixture sintética isolada e gate na suíte de release.`,
);
