// @ts-check
/**
 * assert-open-access.mjs — TRAVA ANTI-REGRESSÃO DO ACESSO ABERTO.
 *
 * Decisão explícita e permanente do autor (Dr. Jadson Fraga): o NeuroPed deve
 * navegar SEM qualquer senha — nem PIN local, nem login por email. Este guard
 * é o oposto de uma catraca de fechamento: ele FALHA o build se alguém tentar
 * re-introduzir cobrança de email/senha nas telas do app.
 *
 * Trava, de forma verificável:
 *   1. accessPolicy.OPEN_ACCESS === true (a flag existe e está ligada);
 *   2. getAccessLevel() retorna "public" para TODA rota — inclusive as clínicas
 *      (prontuário, pacientes, receita, laudo, escalas…);
 *   3. decideRouteAccess() LIBERA ("allow") rota clínica mesmo sem autenticação,
 *      em modo remoto — ou seja, o RouteGuard nunca manda para /login;
 *   4. o PrivateGate curto-circuita em OPEN_ACCESS (nenhum PIN local aparece).
 *
 * Se qualquer um falhar, o deploy quebra. Para reabrir o modelo com senha é
 * preciso, conscientemente, remover este guard — nunca acontece por acidente,
 * merge paralelo ou regressão silenciosa.
 *
 * NOTA: isto trava apenas as TRANCAS DE INTERFACE. A proteção real do dado de
 * paciente permanece na API (Functions Cloudflare/D1 exigem JWT). Abrir a UI
 * não serve o prontuário armazenado sem sessão.
 *
 * Executado via tsx:  npm run guard:open-access  (e dentro de `npm run verify`)
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const read = (rel) => readFileSync(resolve(repoRoot, rel), "utf8");
const importTs = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const errors = [];
const check = (label, fn) => {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    errors.push(`${label}: ${e && e.message ? e.message : e}`);
    console.error(`  ✗ ${label}`);
  }
};

console.log("[open-access] verificando trava anti-regressão de senha…");

// 1. A flag existe e está ligada no código-fonte.
const accessPolicySrc = read("client/src/security/accessPolicy.ts");
check("OPEN_ACCESS declarado e ligado em accessPolicy.ts", () => {
  assert.match(
    accessPolicySrc,
    /export const OPEN_ACCESS\s*=\s*true\s*;/,
    "esperado `export const OPEN_ACCESS = true;` — a cobrança de senha NÃO pode voltar",
  );
});

// 2. getAccessLevel → "public" para toda rota, inclusive clínicas.
const { getAccessLevel, OPEN_ACCESS } = await importTs(
  "client/src/security/accessPolicy.ts",
);
check("OPEN_ACCESS exportado === true", () => {
  assert.equal(OPEN_ACCESS, true);
});

const CLINICAL_ROUTES = [
  "/",
  "/prontuario",
  "/pacientes",
  "/paciente/abc",
  "/documentos",
  "/receita-c1",
  "/receita-c1-express",
  "/laudo-neuroped",
  "/recepcao",
  "/mchat",
  "/cars",
  "/wisc5",
  "/bayley",
  "/generic-scale/smfq",
  "/calculadora-dose",
  "/pant",
  "/rota-clinica-inventada-no-futuro",
];
check("getAccessLevel() === public para toda rota clínica", () => {
  for (const path of CLINICAL_ROUTES) {
    assert.equal(
      getAccessLevel(path),
      "public",
      `${path} deveria abrir sem senha`,
    );
  }
});

// 3. decideRouteAccess LIBERA rota clínica sem autenticação (modo remoto).
const { decideRouteAccess } = await importTs(
  "client/src/security/routeGuardPolicy.ts",
);
check("decideRouteAccess() === allow sem login (modo remoto)", () => {
  for (const path of CLINICAL_ROUTES) {
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: false,
        isLoading: false,
      }),
      "allow",
      `${path} nunca pode mandar para /login`,
    );
  }
});

// 4. O PrivateGate curto-circuita em OPEN_ACCESS (nenhum PIN local aparece).
const privateGateSrc = read("client/src/components/PrivateGate.tsx");
check("PrivateGate desarma o gate local sob OPEN_ACCESS", () => {
  assert.match(
    privateGateSrc,
    /OPEN_ACCESS/,
    "PrivateGate deve honrar OPEN_ACCESS e não exibir PIN",
  );
  assert.match(
    privateGateSrc,
    /!OPEN_ACCESS\s*&&/,
    "as condições de gate do PrivateGate devem ser neutralizadas por !OPEN_ACCESS",
  );
});

if (errors.length) {
  console.error(`\n[open-access] ✗ ${errors.length} regressão(ões) de senha detectada(s):`);
  for (const e of errors) console.error(`  · ${e}`);
  console.error(
    "\nO NeuroPed deve permanecer ABERTO (decisão do autor). Para reverter é\n" +
      "preciso remover conscientemente esta trava em scripts/guards/assert-open-access.mjs.",
  );
  process.exit(1);
}

console.log("[open-access] ✓ app inteiro permanece aberto — nenhuma cobrança de email/senha nas telas.");
