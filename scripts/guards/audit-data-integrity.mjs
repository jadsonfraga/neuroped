// @ts-check
// Auditoria de integridade dos dados das escalas (filtro + catálogo).
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");
const imp = (r) => import(pathToFileURL(resolve(root, r)).href);

const { allScales, queixas } = await imp("client/src/data/scaleFilter.ts");

const appTsx = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const routes = new Set([...appTsx.matchAll(/path="(\/[^"]*)"/g)].map((m) => m[1]));
const hasGenericCatchAll = routes.has("/generic-scale/:id") || /generic-scale\/:/.test(appTsx);

const validQueixas = new Set(queixas.map((q) => q.id));
const validResp = new Set(["pais","clinico","professor","autoaplicavel","crianca","teste_direto_crianca"]);
const validPrio = new Set(["triagem","diagnostica","monitorizacao"]);

const bugs = [];
const seen = new Map();
const routeUsers = new Map();
for (const s of allScales) {
  const where = `${s.id}`;
  if (seen.has(s.id)) bugs.push(["DUP_ID", `${where} == ${seen.get(s.id)}`]); else seen.set(s.id, s.name);
  if (s.ageMin > s.ageMax) bugs.push(["AGE_INVERTED", `${where} ${s.ageMin}>${s.ageMax}`]);
  if (s.ageMin < 0) bugs.push(["AGE_NEG", `${where}=${s.ageMin}`]);
  if (s.ageMax > 216) bugs.push(["AGE_OVER216", `${where}=${s.ageMax}`]);
  if (!s.queixas?.length) bugs.push(["NO_QUEIXA", where]);
  else for (const q of s.queixas) if (!validQueixas.has(q)) bugs.push(["BAD_QUEIXA", `${where}:${q}`]);
  if (!s.respondente?.length) bugs.push(["NO_RESP", where]);
  else for (const r of s.respondente) if (!validResp.has(r)) bugs.push(["BAD_RESP", `${where}:${r}`]);
  if (!validPrio.has(s.prioridade)) bugs.push(["BAD_PRIO", `${where}:${s.prioridade}`]);
  if (!s.description?.trim()) bugs.push(["NO_DESC", where]);
  if (!s.tempo?.trim()) bugs.push(["NO_TEMPO", where]);
  if (!s.fullName?.trim()) bugs.push(["NO_FULLNAME", where]);
  if (typeof s.appRoute === "string") {
    if (s.appRoute.startsWith("/generic-scale/")) {
      const rid = s.appRoute.slice(15);
      if (rid !== s.id) bugs.push(["ROUTE_MISMATCH", `${where} -> ${s.appRoute}`]);
    } else {
      if (!routes.has(s.appRoute)) bugs.push(["ROUTE_404", `${where} -> ${s.appRoute}`]);
      const arr = routeUsers.get(s.appRoute) || []; arr.push(s.id); routeUsers.set(s.appRoute, arr);
    }
  }
}
// rotas dedicadas usadas por >1 id (possível colisão de página)
for (const [route, ids] of routeUsers) if (ids.length > 1) bugs.push(["DUP_ROUTE", `${route} <- ${ids.join(",")}`]);

const byType = {};
for (const [t] of bugs) byType[t] = (byType[t] || 0) + 1;
console.log(`[audit] allScales=${allScales.length} | rotas registradas=${routes.size} | generic catch-all=${hasGenericCatchAll}`);
console.log(`[audit] TOTAL=${bugs.length}`);
console.log(JSON.stringify(byType, null, 2));
for (const [t, m] of bugs) console.log(`  ${t}: ${m}`);
